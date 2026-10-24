import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from './api';
import { DictionaryGroup, DictionaryItem } from './models';

/**
 * Dictionary values used in dropdowns: muscle groups, equipment, roles.
 * Loaded once and cached in signals.
 */
@Injectable({ providedIn: 'root' })
export class LookupsStore {
  private readonly http = inject(HttpClient);

  readonly muscleGroups = signal<DictionaryItem[]>([]);
  readonly equipment = signal<DictionaryItem[]>([]);
  readonly roles = signal<DictionaryItem[]>([]);

  private loaded = false;

  load(force = false): void {
    if (this.loaded && !force) return;
    this.loaded = true;
    this.group(DictionaryGroup.MuscleGroups).subscribe({ next: (x) => this.muscleGroups.set(x), error: () => (this.loaded = false) });
    this.group(DictionaryGroup.Equipment).subscribe({ next: (x) => this.equipment.set(x), error: () => (this.loaded = false) });
  }

  loadRoles(): void {
    this.group(DictionaryGroup.Roles).subscribe((x) => this.roles.set(x));
  }

  group(code: number): Observable<DictionaryItem[]> {
    return this.http.get<DictionaryItem[]>(`${API}/Dictionary/group/${code}`);
  }

  /** Admin: adds a new equipment / muscle group item */
  create(groupCode: number, caption: string): Observable<DictionaryItem> {
    const list = groupCode === DictionaryGroup.Equipment ? this.equipment() : this.muscleGroups();
    const nextCode = Math.max(0, ...list.map((i) => i.dictionaryItemIntCode ?? 0)) + 1;
    return this.http
      .post<DictionaryItem>(`${API}/Dictionary`, {
        dictionaryGroupIntCode: groupCode,
        dictionaryCaption: caption,
        dictionaryItemIntCode: nextCode,
        dictionaryParentID: null,
      })
      .pipe(
        tap((item) => {
          const target = groupCode === DictionaryGroup.Equipment ? this.equipment : this.muscleGroups;
          target.update((items) => [...items, item]);
        }),
      );
  }
}
