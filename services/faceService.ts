import * as faceapi from 'face-api.js';
import { MODEL_URL, FACE_MATCH_THRESHOLD, STORAGE_KEY } from '../constants';
import { UserProfile } from '../types';

class FaceService {
  private labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];
  private modelsLoaded = false;

  public async loadModels(onProgress?: (progress: number) => void): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      // Load models sequentially to update progress if needed
      await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
      if (onProgress) onProgress(30);
      
      await faceapi.loadFaceLandmarkModel(MODEL_URL);
      if (onProgress) onProgress(60);
      
      await faceapi.loadFaceRecognitionModel(MODEL_URL);
      if (onProgress) onProgress(100);

      this.modelsLoaded = true;
      this.loadUsersFromStorage();
    } catch (error) {
      console.error("Failed to load models:", error);
      throw new Error("Failed to load facial recognition models.");
    }
  }

  public isLoaded(): boolean {
    return this.modelsLoaded;
  }

  private loadUsersFromStorage() {
    const usersJson = localStorage.getItem(STORAGE_KEY);
    if (usersJson) {
      const users: UserProfile[] = JSON.parse(usersJson);
      this.labeledDescriptors = users.map(user => {
        const descriptor = new Float32Array(user.descriptor);
        // We use EMAIL as the label for uniqueness and matching
        return new faceapi.LabeledFaceDescriptors(user.email, [descriptor]);
      });
    }
  }

  public async detectFace(video: HTMLVideoElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>> | undefined> {
    if (!this.modelsLoaded) return undefined;

    // Detect single face with landmarks and descriptor
    const result = await faceapi
      .detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    return result;
  }

  public matchFace(descriptor: Float32Array): { email: string; distance: number; label: string } {
    if (this.labeledDescriptors.length === 0) {
      return { email: 'unknown', distance: 1, label: 'unknown' };
    }

    const faceMatcher = new faceapi.FaceMatcher(this.labeledDescriptors, FACE_MATCH_THRESHOLD);
    const match = faceMatcher.findBestMatch(descriptor);

    return {
      email: match.label, // The label is the email
      distance: match.distance,
      label: match.label
    };
  }

  public async registerUser(name: string, email: string, descriptor: Float32Array): Promise<UserProfile> {
    // Check if email already exists
    const existingUsers = this.getUsers();
    if (existingUsers.some(u => u.email === email)) {
      throw new Error("User with this email already exists.");
    }

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name,
      email,
      descriptor: Array.from(descriptor), // Convert Float32Array to regular array for JSON storage
      createdAt: Date.now()
    };

    // Save to local storage
    const users = [...existingUsers, newUser];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

    // Update in-memory matcher using EMAIL as label
    this.labeledDescriptors.push(
      new faceapi.LabeledFaceDescriptors(email, [descriptor])
    );

    return newUser;
  }
  
  public getUsers(): UserProfile[] {
      const usersJson = localStorage.getItem(STORAGE_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    return this.getUsers().find(u => u.email === email);
  }

  public clearUsers(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.labeledDescriptors = [];
  }
}

export const faceService = new FaceService();