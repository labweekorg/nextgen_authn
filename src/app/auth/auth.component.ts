import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css'],
    standalone: false
})
export class AuthComponent {
      currentUrl: string = '';
  title = 'mfa-authentication';
  selectedMethod: boolean = false;
  


  constructor(public router: Router,public activatedRoute: ActivatedRoute) {
     this.currentUrl = window.location.href.split('/').pop() || '';
     if (this.currentUrl && (this.currentUrl === 'bio' || this.currentUrl === 'face' || this.currentUrl === 'pass')) {
       this.selectMethod(this.currentUrl);
     }
     
  }

  selectMethod(method: string) {
    console.log(`Selected method: ${method}`);
    this.router.navigate([`/auth/${method}`]);
    this.selectedMethod = true;

  }
 }