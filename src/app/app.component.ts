import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'stripeAngular';

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  onClickHome() {
    this.router.navigate(['/home']);
  }
}
