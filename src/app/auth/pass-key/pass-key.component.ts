import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
    selector: 'app-pass-key',
    templateUrl: './pass-key.component.html',
    styleUrls: ['./pass-key.component.css'],
    standalone: false
})
export class PassKeyComponent implements OnInit,AfterViewInit {
pkFilled = 0;
passKeyValue: any = '';
  constructor() {
  // this.numpad = new ElementRef(null);
  
  
   }
  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
  }

  otpBack(event: KeyboardEvent, value: any) {



  }
}
