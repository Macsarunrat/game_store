import { Component, inject, OnDestroy, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../services/chat-service';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { map } from 'rxjs';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { AuthService } from '../../../core/auth/auth';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { WebSocketSubject } from 'rxjs/webSocket';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { GameService } from '../../games/services/game.service';
import { Animation } from '../../../shared/animate/all-animate/Fade-up/animation';

interface userModel {
  id: number;
  first_name: string;
  last_name: string;
  status: string | null;
  lasted_message: string | null;
  created_at: Date | string | null;
  time: Date | string | null;
  latest_id: number | null;
  requester_id: number | null;
  receiver_id?: number | null;
  friendship_id?: number | string | null;
}

@Component({
  selector: 'app-chat',
  imports: [
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    ReactiveFormsModule,
    MatButtonModule,
    DatePipe,
    Animation,
    MatPaginatorModule,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('scrollRef') private scrollRef!: ElementRef<HTMLDivElement>;

  private chat = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  public auth = inject(AuthService);
  private game = inject(GameService);
  private socket$!: WebSocketSubject<any>;

  private tempIdCounter = 0;
  message = signal<any[]>([]);
  userData: userModel[] = [];
  firstnameUser: string = '';
  usernameUser: string = '';
  selectedFriendId: number | null = null;
  currentFriendshipId: number | null = null; //  เพิ่มสำหรับเก็บ friendship_id ของคู่ที่คุยอยู่
  currentFriendChat: string = '';
  inputText = new FormControl('');
  searchInput = new FormControl('');
  currentUser: number = 0; // เปลี่ยนเป็นกำหนดค่าใน ngOnInit เพื่อป้องกัน NaN
  activeTab: 'friends' | 'requests' = 'friends';

  ngOnInit(): void {
    //แก้ไขจุดที่ 1: ดึงข้อมูล User ID ให้ชัวร์ใน ngOnInit
    this.currentUser = Number(this.auth.currentUserValue?.user_id || 0);
    this.usernameUser = this.auth.currentUserValue?.username ?? '';
    this.firstnameUser = this.auth.currentUserValue?.firstname ?? '';

    console.log('Current User ID:', this.currentUser);

    // ── เริ่มต้นเชื่อมต่อ Socket ────────────────
    this.socket$ = this.chat.getChat();
    this.socket$.subscribe({
      next: (msg: any) => {
        console.log('raw socket ', msg);

        this.zone.run(() => this.handleSocketMessage(msg));
      },
      error: (err: any) => console.error('Socket error:', err),
      complete: () => console.log('Socket connection closed.'),
    });
    this.authenticateSocket();

    // ── โหลดรายชื่อเพื่อนทั้งหมดเริ่มต้น ───────────────────
    this.game.clearGameCache();
    this.chat
      .getAllFriend()
      .pipe(map((res: any) => res.detail))
      .subscribe({
        next: (res: any) => {
          this.userData = this.sortByLatest(res);
          console.log('All Users loaded:', res);

          // เลือกเพื่อนคนแรกที่มีสถานะเป็น 'friend' มาเปิดแชทรอไว้
          //const firstFriend = res.find((t: any) => t.status === 'friend');
          // if (firstFriend) {
          //   this.onSelectFriend(firstFriend);
          // }

          const lastChatted = this.userData.find((t) => t.status === 'friend' && t.time !== null);

          // fallback — ถ้าไม่มีใครคุยเลย ให้เลือก friend คนแรก
          const toSelect = lastChatted ?? this.userData.find((t) => t.status === 'friend');

          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          if (!isMobile && toSelect) {
            this.onSelectFriend(toSelect);
          }

          this.cdr.detectChanges();
        },
        error: (err) => console.error('Friend list load error:', err),
      });
  }

  private authenticateSocket(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.socket$.next({
      type: 'auth',
      access_token: token,
    });
  }

  private handleSocketMessage(msg: any): void {
    console.log(' Socket incoming message:', msg);

    switch (msg?.type) {
      case 'add_friend':
        this.handleAddFriendMessage(msg);
        return;
      case 'confirm_friend':
        this.handleConfirmFriendMessage(msg);
        return;
      case 'chat_message':
        this.handleChatMessage(msg);
        return;
      default:
        return;
    }
  }

  private handleAddFriendMessage(msg: any): void {
    console.log(' handleChat:', {
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      currentUser: this.currentUser, // ดูว่า currentUser ถูกต้องไหม
      selectedFriendId: this.selectedFriendId,
      targetFriendId: this.resolveTargetFriendId(
        this.toNumber(msg.sender_id),
        this.toNumber(msg.receiver_id),
      ), // ดูว่า resolve ได้ถูกคนไหม
      friendshipId: msg.friendship_id,
    });

    const requesterId = this.toNumber(msg?.requester_id);
    if (requesterId === null) return;

    const isExistingUser = this.userData.some((user) => user.id === requesterId);
    if (isExistingUser) {
      this.userData = this.userData.map((user) =>
        user.id === requesterId ? { ...user, status: 'pending', requester_id: requesterId } : user,
      );
    } else {
      this.userData = [
        ...this.userData,
        {
          id: requesterId,
          first_name: msg?.first_name ?? 'New',
          last_name: msg?.last_name ?? 'User',
          status: 'pending',
          lasted_message: null,
          created_at: new Date(),
          time: new Date(),
          latest_id: null,
          requester_id: requesterId,
        },
      ];
    }

    this.cdr.detectChanges();
  }

  private handleConfirmFriendMessage(msg: any): void {
    const confirmFromId = this.toNumber(msg?.confirm_from_id);
    const receiverId = this.toNumber(msg?.receiver_id);
    const friendshipId = this.toNumber(msg?.friendship_id);

    this.userData = this.userData.map((user) => {
      const isConfirmedFriend = user.id === confirmFromId || user.id === receiverId;
      if (!isConfirmedFriend) return user;

      return {
        ...user,
        status: 'friend',
        ...(friendshipId !== null ? { friendship_id: friendshipId } : {}),
      };
    });

    if (
      this.selectedFriendId !== null &&
      (this.selectedFriendId === confirmFromId || this.selectedFriendId === receiverId) &&
      friendshipId !== null
    ) {
      this.currentFriendshipId = friendshipId;
    }

    this.cdr.detectChanges();
  }

  private handleChatMessage(msg: any): void {
    if (msg?.message === undefined || msg?.message === null) return;

    const messageText = String(msg.message);
    const senderId = this.toNumber(msg.sender_id);
    const receiverId = this.toNumber(msg.receiver_id);
    const targetFriendId = this.resolveTargetFriendId(senderId, receiverId);

    if (targetFriendId === null) return;

    const createdAt = msg.created_at ?? new Date().toISOString();
    const socketFriendshipId = this.toNumber(msg.friendship_id);
    const friendshipId =
      socketFriendshipId ??
      (this.selectedFriendId === targetFriendId ? this.currentFriendshipId : null);
    const isFromCurrentUser = senderId === this.currentUser;

    this.updateFriendLastMessage(targetFriendId, messageText, createdAt, senderId, friendshipId);

    if (this.selectedFriendId === targetFriendId) {
      if (friendshipId !== null) {
        this.currentFriendshipId = friendshipId;
      }

      if (!isFromCurrentUser) {
        this.message.update((prev) => [
          ...prev,
          {
            id: msg?.id ?? Math.random(),
            sender_id: senderId,
            friendship_id: friendshipId,
            message: messageText,
            created_at: createdAt,
          },
        ]);
        this.scrollToBottom();
      }
    }

    this.cdr.detectChanges();
  }

  private updateFriendLastMessage(
    friendId: number,
    message: string,
    createdAt: Date | string,
    latestId: number | null,
    friendshipId: number | null,
  ): void {
    const friendIndex = this.userData.findIndex((user) => user.id === friendId);
    if (friendIndex === -1) return;

    const updatedUser: userModel = {
      ...this.userData[friendIndex],
      lasted_message: message,
      created_at: createdAt,
      time: createdAt,
      latest_id: latestId,
      ...(friendshipId !== null ? { friendship_id: friendshipId } : {}),
    };

    const updated = [updatedUser, ...this.userData.filter((_, index) => index !== friendIndex)];

    this.userData = this.sortByLatest(updated);
  }

  private resolveTargetFriendId(senderId: number | null, receiverId: number | null): number | null {
    if (senderId !== null && senderId === this.currentUser)
      return receiverId ?? this.selectedFriendId;
    if (receiverId !== null && receiverId === this.currentUser) return senderId;
    return null;
  }

  private findFirstFriendshipId(items: any[]): number | null {
    for (const item of items) {
      const friendshipId = this.toNumber(item?.friendship_id);
      if (friendshipId !== null) return friendshipId;
    }
    return null;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private scrollToBottomInstant(): void {
    setTimeout(() => {
      const el = this.scrollRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.scrollRef?.nativeElement;
      el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 0);
  }

  private generateTempId(): string {
    return `temp-${Date.now()}-${++this.tempIdCounter}`;
  }

  send(): void {
    const text = this.inputText.value;
    if (!text || text.trim() === '') return;
    if (this.selectedFriendId === null) return;

    const nowIso = new Date().toISOString();
    const receiverId = this.selectedFriendId;
    const friendshipId = this.currentFriendshipId;

    // 1. แสดงข้อความฝั่งตัวเองทันที (Optimistic Update)
    this.message.update((prev) => [
      ...prev,
      {
        id: this.generateTempId(),
        sender_id: this.currentUser,
        receiver_id: receiverId,
        friendship_id: friendshipId,
        message: text,
        created_at: nowIso,
      },
    ]);
    console.log('ข้อความที่ส่ง ', this.message());
    console.log('📤 Sending:', {
      text: this.inputText.value,
      receiverId: this.selectedFriendId,
      friendshipId: this.currentFriendshipId, // null = ยังไม่มี friendship
      currentUser: this.currentUser,
    });

    // 2. อัปเดตข้อมูลแถบล่าสุดใน Sidebar ของเพื่อนคนนี้ทันที
    this.updateFriendLastMessage(receiverId, text, nowIso, this.currentUser, friendshipId);

    // 3.  แก้ไขจุดที่ 3: ส่งข้อมูลหา Server (แนบทั้ง receiver_id และ friendship_id เพื่อความปลอดภัย)
    this.socket$.next({
      type: 'chat_message',
      receiver_id: receiverId,
      friendship_id: friendshipId,
      message: text,
      access_token: localStorage.getItem('token'),
    });

    this.inputText.setValue('');
    this.scrollToBottom();
    this.cdr.detectChanges();
  }

  onSelectFriend(user: any): void {
    if (this.selectedFriendId === user.id) return;

    this.selectedFriendId = user.id;
    this.currentFriendChat = `${user.first_name} ${user.last_name}`;
    this.currentFriendshipId = this.toNumber(user?.friendship_id);

    this.getHistoryChat(user.id);
  }

  onBackToFriends(): void {
    this.selectedFriendId = null;
  }

  getHistoryChat(receiverId: number): void {
    this.message.set([]);
    this.chat
      .getHistory(receiverId)
      .pipe(map((item: any) => item.detail))
      .subscribe({
        next: (res: any[]) => {
          console.log(' History loaded:', res);
          this.message.set(res);

          console.log('📜 History:', res.length, 'messages');
          console.log('📜 Sample:', res[0]); // ดู sender_id, receiver_id, friendship_id

          const friendshipId = this.findFirstFriendshipId(res);
          if (friendshipId !== null) {
            this.currentFriendshipId = friendshipId;
          }

          this.scrollToBottomInstant();
        },
        error: (err) => console.error('History error:', err),
      });
  }

  get filteredUserData(): userModel[] {
    const query = this.searchInput.value?.toLowerCase().trim() || '';
    if (!query) {
      return this.userData;
    }
    return this.userData.filter(
      (user) =>
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query),
    );
  }

  getDisplayTime(timeInput: any): string {
    if (!timeInput) return '';
    const targetDate = new Date(timeInput);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (targetDate.toDateString() === today.toDateString()) {
      return targetDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
    if (targetDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return targetDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  isNewDay(index: number): boolean {
    if (index === 0) return true;
    const current = new Date(this.message()[index].created_at);
    const previous = new Date(this.message()[index - 1].created_at);
    return current.toDateString() !== previous.toDateString();
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.send();
  }

  isLastInGroup(index: number): boolean {
    const msgs = this.message();
    const current = msgs[index];
    const next = msgs[index + 1];

    if (!next) return true;
    return next.sender_id !== current.sender_id;
  }

  acceptFriend(id: number) {
    console.log('friend id = ', id);
    this.chat.postAcceptFriend(id).subscribe({
      next: (res) => {
        console.log('accepted frined = ', res);
        const friendshipId = this.toNumber((res as any)?.detail?.friendship_id);
        this.userData = this.userData.map((user) => {
          if (user.id === id) {
            // เปลี่ยนสถานะเป็นอย่างอื่น เพื่อให้หลุดจากเงื่อนไข 'pending' ใน HTML
            return {
              ...user,
              status: 'friend',
              ...(friendshipId !== null ? { friendship_id: friendshipId } : {}),
            };
          }
          return user;
        });

        //  เพิ่มส่วนนี้: ยิง Socket แจ้งเตือนฝั่งคนแอด ว่าเรากดยอมรับแล้ว (Real-time)
        this.socket$.next({
          type: 'confirm_friend',
          receiver_id: id,
          confirm_from_id: this.currentUser,
          friendship_id: friendshipId,
          access_token: localStorage.getItem('token'),
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('accepted friend fail = ', err);
      },
    });
  }

  addFriend(id: number) {
    console.log('friend add = ', id);
    this.chat.postAddFriend(id).subscribe({
      next: (res) => {
        console.log('add friend successful ', res);
        this.userData = this.userData.map((user) => {
          if (user.id === id) {
            // เปลี่ยนสถานะเป็นอย่างอื่น เพื่อให้หลุดจากเงื่อนไข 'pending' ใน HTML
            return { ...user, status: 'pending', requester_id: this.currentUser };
          }
          return user;
        });

        //  เพิ่มส่วนนี้: ยิง Socket แจ้งเตือนฝั่งคนรับ ให้ขึ้น Pending ทันที (Real-time)
        this.socket$.next({
          type: 'add_friend',
          receiver_id: id,
          requester_id: this.currentUser,
          first_name: this.firstnameUser,
          // ดึงนามสกุลมาส่งด้วย (ตรวจสอบชื่อตัวแปร lastname ใน auth service ของคุณอีกทีนะครับ)
          access_token: localStorage.getItem('token'),
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('add friend failed', err);
      },
    });
  }

  private sortByLatest(users: userModel[]): userModel[] {
    return [...users].sort((a, b) => {
      const dateA = new Date(a.created_at ?? 0).getTime();
      const dateB = new Date(b.created_at ?? 0).getTime();
      return dateB - dateA;
    });
  }

  ngOnDestroy(): void {
    if (this.socket$) this.socket$.complete();
  }
}
