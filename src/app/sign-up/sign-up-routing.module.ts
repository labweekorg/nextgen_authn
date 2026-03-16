import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignUpComponent } from './sign-up.component';
import { authGuard } from '../guard/auth.guard';

const routes: Routes = [{
  path:'',
  canActivate:[authGuard],
  component:SignUpComponent,
  
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SignUpRoutingModule { }
