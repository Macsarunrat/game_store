import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameService } from '../../games/services/game.service';
import { AuthService } from '../../../core/auth/auth';
import { Observable } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Cache } from '../../../core/cache/cache';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private gameState = inject(GameService);
  private auth = inject(AuthService);
  private cache = inject(Cache);
  private socket$!: WebSocketSubject<any>;

  getAllFriend() {
    return this.http.get('/api/v1/chat/me/friends');
  }

  getChat() {
    // ถ้ายังไม่มีท่อ หรือท่อปิดไปแล้ว ให้สร้างใหม่รอบเดียว
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket('ws://192.168.1.66:8000/api/v1/chat/ws/me');
    }
    return this.socket$; //
  }

  getHistory(receiverId: number) {
    this.cache.clearCache();
    return this.http.get(`/api/v1/chat/history/${receiverId}`);
  }

  postAddFriend(id: number) {
    return this.http.post('/api/v1/chat/add/new-friend', { friend_id: id });
  }

  postAcceptFriend(id: number) {
    return this.http.post('/api/v1/chat/confirm/friend', { friend_id: id });
  }

  postCreateAccount(form: any) {
    const payload = {
      first_name: form.firstName,
      last_name: form.surName,
      username: form.userName,
      password: form.passWord,
      email: form.email,
    };
    console.log('payload Chat = ', payload);

    return this.http.post('/api/v1/user/register', payload, { observe: 'response' });
  }
}
