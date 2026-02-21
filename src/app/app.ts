import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  template: `
    <app-header></app-header>

    <router-outlet />
  `,
  styles: [],
})
export class App {
  protected readonly title = signal('stream');
}
