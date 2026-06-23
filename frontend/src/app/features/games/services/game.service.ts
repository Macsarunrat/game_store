import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay, Subject } from 'rxjs';
import { GameStateService } from './game-state.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private gameCache$: Observable<any> | null = null;
  private gameStripeSource = new Subject();
  gameStripe$ = this.gameStripeSource.asObservable();

  constructor(
    private http: HttpClient,
    private gameState: GameStateService,
  ) {}

  getAllGame(): Observable<any> {
    if (!this.gameCache$) {
      this.gameCache$ = this.http.get('/api/v1/game/').pipe(shareReplay(1));
    }
    return this.http.get('/api/v1/game/');
  }

  clearGameCache() {
    this.gameCache$ = null;
  }

  getAllCategories(): Observable<any> {
    return this.http.get('/api/v1/game/catagory');
  }

  buyGameNow() {
    const currentGameId = this.gameState.currentGameId;
    const payload = {
      game_id: currentGameId,
    };

    return this.http.post('/api/v1/game/buy', payload).subscribe({
      next: (resp: any) => {
        console.log('ค่าที่ได้ ', resp);
        const data = resp.detail;
        const newData = data.checkout;
        console.log('checkout = ', newData);
        this.gameStripeSource.next(newData);
      },
      error: (err) => {
        console.error('ค่า error ', err);
      },
    });
  }

  postUpdateGameData() {
    const value = this.gameState.currentGameDetail;
    const gameId = value?.game_id ?? 0;
    console.log('value ที่ได้ ', value);

    const data: {
      game_id: number;
      name?: any;
      description?: any;
      price?: any;
      catagories?: any;
    } = {
      game_id: gameId,
      name: this.gameState.updateNameValue,
      description: this.gameState.updateDescriptionValue,
      price: this.gameState.updatePriceValue,
      catagories: this.gameState.updateCategoryValue,
    };

    if (!data.price) {
      delete data.price;
    }
    if (!data.name) {
      delete data.name;
    }
    if (!data.description) {
      delete data.description;
    }
    if (!data.catagories) {
      delete data.catagories;
    }

    console.log('data invalid', data);

    return this.http.patch('/api/v1/game/update-info', data, { observe: 'response' });
  }

  deleteImg() {
    const data = this.gameState.selectedImageIds;
    let params = new HttpParams();
    data.forEach((item) => {
      params = params.append('image_id', item.toString());
    });

    return this.http.delete('/api/v1/image/delete-image-list', { params, observe: 'response' });
  }

  imgUpdate() {
    const formdata = new FormData();
    const gameId = this.gameState.uploadGameId;
    const isMain = this.gameState.uploadIsMain;
    const file = this.gameState.uploadFile;
    formdata.append('file', file);
    formdata.append('game_id', gameId.toString());
    formdata.append('is_main', isMain.toString());

    formdata.forEach((value, key) => {
      console.log('Key:', key, 'Value:', value, 'Type:', typeof value);
    });

    return this.http.post('/api/v1/image/upload-image', formdata, { observe: 'response' });
  }

  postCreateGame() {
    return this.http.post(
      '/api/v1/game/create-game',
      {
        name: this.gameState.updateNameValue,
        description: this.gameState.updateDescriptionValue,
        price: this.gameState.updatePriceValue,
        catagories: this.gameState.selectedGameIds,
      },
      { observe: 'response' },
    );
  }

  deleteGames() {
    let params = new HttpParams();
    const gameId = this.gameState.selectedGameIds;
    gameId.forEach((id) => {
      params = params.append('game_id', id.toString());
    });
    return this.http.delete('/api/v1/game/delete', { params, observe: 'response' });
  }

  payGameAgain(order_id: number) {
    const params = new HttpParams().set('order_id', order_id);
    return this.http.post('/api/v1/order/pay-again', null, {
      params: params,
      observe: 'response',
    });
  }

  gameHidden(id: number, status: boolean) {
    const game_id = id;
    const is_hidden = status;
    console.log('sending ', id, is_hidden);

    return this.http.put('/api/v1/game/hidden', { game_id, is_hidden }, { observe: 'response' });
  }
}
