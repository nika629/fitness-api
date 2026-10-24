import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Left side of the login/register screens */
@Component({
  selector: 'app-auth-wall',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-wall.scss',
  template: `
    <span class="brand"><span class="mark" aria-hidden="true"><i></i><i></i></span>Fitness</span>

    <div>
      <p class="headline">Plan the lift. Log the meal. Show up again.</p>
      <p>Build workout plans from 20+ exercises and keep a daily food log with protein, carbs and fat.</p>
    </div>

    <div class="plates" aria-hidden="true">
      <span style="height: 100%; background: var(--red)"></span>
      <span style="height: 88%; background: var(--blue)"></span>
      <span style="height: 74%; background: var(--yellow)"></span>
      <span style="height: 60%; background: var(--green)"></span>
      <span style="height: 44%; background: var(--steel)"></span>
    </div>
  `,
})
export class AuthWall {}
