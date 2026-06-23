import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  private searchSource = new BehaviorSubject<string>('');
  private categorySource = new BehaviorSubject<string[]>([]);
  private gameIdSource = new BehaviorSubject<number | null>(null);
  private gamePurchasedSource = new BehaviorSubject<number[]>([]);
  private gameDetailSource = new BehaviorSubject<any>([]);
  private gameCategoryUpdate = new BehaviorSubject<any>(null);
  private gameNameUpdate = new BehaviorSubject<any>('');
  private gameDescriptionUpdate = new BehaviorSubject<any>('');
  private gamePriceUpdate = new BehaviorSubject<any>('');
  private fileUpdate = new BehaviorSubject<File>(new File([], 'default'));
  private isMain = new BehaviorSubject<boolean>(false);
  private gId = new BehaviorSubject<number>(0);
  private selectedImg = new BehaviorSubject<number[]>([]);
  private selectedGameSource = new BehaviorSubject<number[]>([]);

  private refreshSource = new Subject<void>();
  private allGameRefreshSource = new Subject<void>();

  refresh$ = this.refreshSource.asObservable();
  allGameRefresh$ = this.allGameRefreshSource.asObservable();
  gamePurchased$ = this.gamePurchasedSource.asObservable();
  currentSearch$ = this.searchSource.asObservable();
  currentCategory$ = this.categorySource.asObservable();
  currentGameId$ = this.gameIdSource.asObservable();
  currentGameDetail$ = this.gameDetailSource.asObservable();
  postUpdateGameCategory$ = this.gameCategoryUpdate.asObservable();
  postUpdateGameName$ = this.gameNameUpdate.asObservable();
  postUpdateGamePrice$ = this.gamePriceUpdate.asObservable();
  postUpdateDescription$ = this.gameDescriptionUpdate.asObservable();
  postUpdateFile$ = this.fileUpdate.asObservable();
  postIsmain$ = this.isMain.asObservable();
  postgId$ = this.gId.asObservable();
  selectedGameImg$ = this.selectedImg.asObservable();
  selectedGameId$ = this.selectedGameSource.asObservable();

  get currentGameId(): number | null {
    return this.gameIdSource.value;
  }

  get currentGameDetail(): any {
    return this.gameDetailSource.value;
  }

  get updateCategoryValue(): any {
    return this.gameCategoryUpdate.value;
  }

  get updateNameValue(): any {
    return this.gameNameUpdate.value;
  }

  get updateDescriptionValue(): any {
    return this.gameDescriptionUpdate.value;
  }

  get updatePriceValue(): any {
    return this.gamePriceUpdate.value;
  }

  get selectedImageIds(): number[] {
    return this.selectedImg.value;
  }

  get uploadFile(): File {
    return this.fileUpdate.value;
  }

  get uploadGameId(): number {
    return this.gId.value;
  }

  get uploadIsMain(): boolean {
    return this.isMain.value;
  }

  get selectedGameIds(): number[] {
    return this.selectedGameSource.value;
  }

  updateSearchItem(item: string) {
    this.searchSource.next(item);
  }

  updateFilterCategory(category: string[]) {
    this.categorySource.next(category);
  }

  gameSelected(game: number) {
    this.gameIdSource.next(game);
  }

  gamePurchase(id: number[]) {
    this.gamePurchasedSource.next(id);
  }

  updateGameDetail(item: any) {
    this.gameDetailSource.next(item);
  }

  gameCateId(num: any) {
    this.gameCategoryUpdate.next(num);
  }

  gameName(text: string | null) {
    this.gameNameUpdate.next(text);
  }

  gamePrice(num: any) {
    this.gamePriceUpdate.next(num);
  }

  gameDescrription(text: string | null) {
    this.gameDescriptionUpdate.next(text);
  }

  gamefill(file: File) {
    this.fileUpdate.next(file);
  }

  gameIsmain(bool: boolean) {
    this.isMain.next(bool);
  }

  gameIDS(num: any) {
    this.gId.next(num);
  }

  gameSelectedImg(item: number[]) {
    this.selectedImg.next(item);
  }

  gameSelectedId(item: number[]) {
    this.selectedGameSource.next(item);
  }

  triggerRefresh() {
    this.refreshSource.next();
  }

  triggerAllGameRefresh() {
    this.allGameRefreshSource.next();
  }
}
