import { Component, OnInit } from '@angular/core';
import { CloudinaryService } from '../shared/services/cloudinary/cloudinary.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-profiles',
    templateUrl: './profiles.component.html',
    styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {

    imageUrl: string | null = null;
    loading = false;
    profileId: string = '';
    profileData: any;

    constructor(private cloudinaryService: CloudinaryService, private route: ActivatedRoute, private http: HttpClient) { }

    ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.profileId = params.get('id')!;
      this.getProfile();
    });
    }

    getProfile() {
    this.http.get(`http://localhost:5000/api/users/${this.profileId}`)
      .subscribe(res => {
        this.profileData = res;
      });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.loading = true;

            // this.cloudinaryService.uploadImage(file,'ivansho','123').subscribe({
            //     next: (res) => {
            //         this.imageUrl = res.secure_url;
            //         console.log('✅ Imagen subida:', res);
            //         this.loading = false;
            //     },
            //     error: (err) => {
            //         console.error('❌ Error al subir imagen:', err);
            //         this.loading = false;
            //     }
            // });
        }
    }


}