import { CanActivateFn, Router } from "@angular/router";
import { AuthStateService } from "../service/authState.service";
import { inject } from "@angular/core";
import { map, take } from "rxjs";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthStateService);
  const router = inject(Router);
console.log(" Hello ",authService.isAuthenticated$);

return authService.isAuthenticated$.pipe(
    take(1), // Take only the first emission
    map(isAuthenticated => {
      console.log("Is authenticated:", isAuthenticated);
      if (!isAuthenticated) {
        router.navigate(['/']);
        return false;
      }
      return true;
    })
  );
  
};