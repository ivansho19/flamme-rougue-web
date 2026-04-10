import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private cloudName = 'dr4n5n4g9';
  private uploadPreset = 'flammeRouge';

  constructor(private http: HttpClient) {}

  uploadImage(file: File, folder: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', this.uploadPreset);
  formData.append('folder', folder);

  return this.http.post(
    `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    formData
  );
}

  
}
