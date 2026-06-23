import { ChangeDetectorRef, Component, inject, signal, ViewChild } from '@angular/core';
import { GameService } from '../services/game.service';
import { GameStateService } from '../services/game-state.service';
import { OrderService } from '../../orders/services/order.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth';
import { MatListModule, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { PageEvent, MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Gamedetail } from '../game-detail/gamedetail';
import { GamedetailAdmin } from '../game-detail-admin/gamedetail-admin';
import { CreateDialog } from '../dialogs/create-dialog/create-dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Animation } from '../../../shared/animate/all-animate/Fade-up/animation';
import { FadeRight } from '../../../shared/animate/all-animate/fadeR/fade-right';

import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Subject,
  takeUntil,
} from 'rxjs';
import Swal from 'sweetalert2';
import { NovaConfirmService } from '../../../shared/confirm/nova-confirm.service';
import { novaSwalConfirmBrand, novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';

import { StaticUrlPipe } from '../../../shared/pipes/static-url-pipe';
import { CdkAriaLive } from '../../../../../node_modules/@angular/cdk/types/_a11y-module-chunk';

@Component({
  selector: 'app-allgame',
  imports: [
    FadeRight,
    MatGridListModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatPaginatorModule,
    MatIconModule,
    StaticUrlPipe,
    MatCheckboxModule,
    Animation,
    MatTooltipModule,
  ],
  templateUrl: './allgame.html',
  styleUrl: './allgame.css',
})
export class Allgame {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  public auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);
  private confirm = inject(NovaConfirmService);
  private gameService = inject(GameService);
  private gameState = inject(GameStateService);
  private orderService = inject(OrderService);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('categoryList') categoryList!: MatSelectionList;
  gameAll: any = [];
  pageGames: any = [];
  imgProfile: any = [];
  first_name?: string = this.auth.currentUserValue?.firstname;
  categories: any = [];
  allGameSearch: any[] = [];
  ownedGame: number[] = [];
  gameCustomer: any[] = [];
  pageSize = 0;
  currentPage = 0;
  isDelete = false;
  selectedGames: number[] = [];
  imgObj: any = [];
  imgMain: any[] = [];
  notification: {} = {};
  gameOrder: string = '';
  customerName: string = '';
  time: any = '';
  selectedCategories: string[] = [];
  isCategoriesCollapsed = true;
  allDetail: any = [];

  updatePagedGames() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pageGames = this.gameAll.slice(startIndex, endIndex);
  }

  // 4. ฟังก์ชันทำงานเมื่อผู้ใช้กดเปลี่ยนหน้า
  handlePageEvent(e: PageEvent) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;

    //  สั่งหั่นข้อมูลใหม่ตามหน้าและจำนวนที่เลือก
    this.updatePagedGames();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  search(text: string) {
    this.searchSubject.next(text);
  }

  gameDescript(id: string) {
    if (this.isDelete === false) {
      if (this.auth.hasRole('customer')) {
        this.dialog.open(Gamedetail, {
          data: { id: id },

          // ปรับขนาดให้ไม่เต็มจอ 100% เพื่อให้เห็นว่ามัน "อยู่ตรงกลาง"
          width: '100%', // ใช้ % แทน vw เพื่อความเสถียร
          maxWidth: '80vw', // ล็อกความกว้างสูงสุดไว้
          minHeight: '65vh', // ไม่ให้สูงเกินหน้าจอ
          // ปรับสูงตามเนื้อหา

          //  ทำให้หน้าจอเบื้องหลังนิ่งสนิท
          scrollStrategy: this.overlay.scrollStrategies.noop(),
          panelClass: 'custom-dialog-container',

          //  (Optional) ถ้าอยากให้เปิดแล้วอยู่ตำแหน่งเดิมเสมอ
          autoFocus: false,
          restoreFocus: false,
        });
      } else
        this.dialog.open(GamedetailAdmin, {
          data: { id: id },

          // ปรับขนาดให้ไม่เต็มจอ 100% เพื่อให้เห็นว่ามัน "อยู่ตรงกลาง"

          width: '100%', // ใช้ % แทน vw เพื่อความเสถียร
          maxWidth: '80vw', // ล็อกความกว้างสูงสุดไว้
          minHeight: '65vh', // ไม่ให้สูงเกินหน้าจอ
          // ปรับสูงตามเนื้อหา

          //  ทำให้หน้าจอเบื้องหลังนิ่งสนิท
          scrollStrategy: this.overlay.scrollStrategies.noop(),
          panelClass: 'custom-dialog-container',

          //  (Optional) ถ้าอยากให้เปิดแล้วอยู่ตำแหน่งเดิมเสมอ
          autoFocus: false,
          restoreFocus: false,
        });
    } else {
      alert('delete activated');
    }
  }

  ngOnInit() {
    const status = this.route.snapshot.queryParamMap.get('payment_status');
    const orderId = this.route.snapshot.queryParamMap.get('order_id');

    if (status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'ชำระเงินสำเร็จ',
        reverseButtons: true,
        topLayer: true,
        text: `Order ID: ${orderId}`,
        ...novaSwalConfirmBrand(),
        ...novaSwalDarkBase(),
      });
    } else if (status === 'cancel') {
      Swal.fire({
        icon: 'error',
        topLayer: true,
        reverseButtons: true,
        title: 'ยกเลิกการชำระเงิน',
        text: `Order ID: ${orderId}`,
        ...novaSwalConfirmBrand(),
        ...novaSwalDarkBase(),
      });
    }

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: any) => {
        this.gameState.updateSearchItem(term);
      });

    this.loadData();
    console.log('role = ', this.auth.currentUserValue?.roles);

    this.gameState.gamePurchased$.subscribe((game_id) => {
      console.log('order global = ', game_id);
    });

    this.gameState.allGameRefresh$.subscribe(() => {
      this.loadData();
    });
  }

  loadData() {
    this.imgProfile = [];
    this.first_name = this.auth.currentUserValue?.firstname;
    this.categories = [];
    this.allGameSearch = [];
    this.ownedGame = [];
    this.gameCustomer = [];
    this.pageSize = 12;

    this.orderService
      .gameOrder()
      .pipe(map((g) => g.detail))
      .subscribe({
        next: (res_order) => {
          this.gameCustomer = res_order;
          console.log('order = ', this.gameCustomer);
          this.ownedGame = this.gameCustomer.filter(
            (g) => g.user_id === this.auth.currentUserValue?.user_id,
          );
          console.log('Latest order = ', this.ownedGame);
          this.gameState.gamePurchase(this.ownedGame);
        },
        error: (err) => {
          console.error('error fetch order หน้า allgames = ', err);
        },
      });

    // this.gameState.gamePurchased$.subscribe((id) => {
    //   this.ownedGame = id;
    //   console.log('เกมมที่ได้จาก global state ', this.ownedGame);

    // });

    const savedPage = this.paginator ? this.paginator.pageIndex : this.currentPage;
    const savedPageSize = this.paginator ? this.paginator.pageSize : this.pageSize;
    this.gameAll = [];
    this.pageGames = [];
    this.gameService.getAllGame().subscribe({
      next: (response) => {
        console.log('response = ', response.detail);
        this.allDetail = response.detail;

        this.allGameSearch = response.detail;
        if (this.auth.hasRole('customer')) {
          this.gameAll = this.allGameSearch.filter(
            (game) => !game.is_hidden || game.is_hidden === 'False' || game.is_hidden === 'false',
          );
          this.allGameSearch = this.gameAll;
        } else {
          this.gameAll = [...this.allGameSearch];
        }

        console.log('all', this.gameAll);
        console.log('p = ', this.pageGames);

        console.log('sadas = ', this.imgMain);

        // const detail = response.detail;
        // this.imgObj = detail.map((item: any) =>
        //   item.images.findLast((img: any) => img.is_main === true),
        // );

        // console.log('img = ', this.imgObj);

        const maxPage = Math.ceil(this.gameAll.length / savedPageSize) - 1;
        this.currentPage = Math.min(savedPage, Math.max(0, maxPage));
        this.pageSize = savedPageSize;

        //this.listenToSearch();

        // console.log(this.gameAll);

        // sync กับ paginator
        if (this.paginator) {
          this.paginator.pageIndex = this.currentPage;
          this.paginator.pageSize = this.pageSize;
          this.paginator.length = this.gameAll.length;
        }

        // 4. สั่งตรวจสอบการเปลี่ยนแปลง ( ถ้าไม่ได้ใช้ Signal)

        this.updatePagedGames();
        this.listenToFilters();
        this.cdr.detectChanges();

        //console.log('ข้อมูลใน gameAll ปัจจุบัน:', this.gameAll);
      },
      error: (err) => {
        console.error('ดึงข้อมูลไม่สำเร็จ:', err);
      },
    });
    this.gameService.getAllCategories().subscribe({
      next: (cata_resp) => {
        this.categories = cata_resp.detail;
        this.cdr.detectChanges();
        console.log(this.categories);
      },
      error: (err) => {
        console.error('ดึงข้อมูลไม่สำเร็จ catagories:', err);
      },
    });
  }

  listenToSearch() {
    this.gameState.currentSearch$.subscribe((term) => {
      if (!term || term.trim() === '') {
        // ถ้าไม่มีคำค้นหา ให้โชว์ข้อมูลต้นฉบับทั้งหมด
        this.gameAll = [...this.allGameSearch];
      } else {
        // กรองข้อมูลที่ชื่อเกม (name) ตรงกับคำค้นหา
        const lowerTerm = term.toLowerCase();
        this.gameAll = this.allGameSearch.filter((game) =>
          game.name.toLowerCase().includes(lowerTerm),
        );
      }

      this.updatePagedGames();
      this.cdr.detectChanges();
    });
  }

  listenToFilters() {
    //  ใช้ combineLatest เพื่อรวมสัญญาณจากทั้ง Search และ Category
    combineLatest([
      this.gameState.currentSearch$.pipe(debounceTime(100), distinctUntilChanged()), // (1) คำค้นหา
      this.gameState.currentCategory$.pipe(
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      ), // (2) หมวดหมู่ที่เลือก (Array ของ ID)
    ]).pipe(takeUntil(this.destroy$)).subscribe(([searchTerm, selectedCategories]) => {
      // 1. เริ่มต้นด้วยข้อมูลดิบทั้งหมดเสมอ
      let filtered = [...this.allGameSearch];

      // 2. กรองด้วยคำค้นหา (Search)
      if (searchTerm && searchTerm.trim() !== '') {
        const lowerTerm = searchTerm.toLowerCase();

        filtered = filtered.filter((game) => game.name.toLowerCase().includes(lowerTerm));
        this.currentPage = 0;
      }

      // 3. กรองด้วยหมวดหมู่ (Checkbox / Categories)
      // ตรวจสอบว่า selectedCategories มีข้อมูลอยู่ใน Array ไหม
      if (selectedCategories && selectedCategories.length > 0) {
        filtered = filtered.filter((game) => {
          if (!game.catagories) return false;
          else {
            this.currentPage = 0;
            return game.catagories.some((cate: any) => selectedCategories.includes(cate)); //some = มีบางตัวได้ , every = ต้องมีเท่านั้น
          }
        });
      }

      // 4. นำผลลัพธ์ที่ผ่านการกรองทั้ง 2 ชั้นมาเก็บในตัวแปรแสดงผล
      this.gameAll = [...filtered];

      // 5. อัปเดตการแบ่งหน้า (Pagination) และแจ้งการเปลี่ยนแปลง UI
      this.updatePagedGames();

      this.cdr.detectChanges();

      console.log('Filtered Results:', this.gameAll);
    });
  }

  onCategoryChange(event: MatSelectionListChange) {
    const selectedValue = event.source.selectedOptions.selected.map((check: any) => check.value);
    this.selectedCategories = selectedValue; //update ค่าที่เลือก
    this.gameState.updateFilterCategory(selectedValue);
  }

  isSelected(cateName: string): boolean {
    return this.selectedCategories.includes(cateName);
  }

  clearSelected() {
    this.selectedCategories = [];
    this.gameState.updateFilterCategory([]);
    if (this.categoryList) {
      this.categoryList.deselectAll();
    }
    this.cdr.detectChanges();
  }

  toggleCategoriesMenu() {
    this.isCategoriesCollapsed = !this.isCategoriesCollapsed;
    this.cdr.detectChanges();
  }

  openCreate() {
    const dialogCreate = this.dialog.open(CreateDialog, {
      width: 'min(92vw, 560px)',
      maxWidth: '92vw',
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      panelClass: 'customupdate-container',
      autoFocus: false,
    });
  }

  deleteGame() {
    if (this.isDelete === false) {
      Swal.fire({
        title: 'Delete',
        topLayer: true,
        reverseButtons: true,
        text: 'คุณต้องเลือกเกมที่ต้องการลบอย่างน้อย 1 เกม',
        icon: 'warning',
        ...novaSwalConfirmPrimary(),
        scrollbarPadding: false,
        ...novaSwalDarkBase(),
      });
      this.isDelete = !this.isDelete;
      this.selectedGames = [];
    } else {
      this.isDelete = !this.isDelete;
      Swal.fire({
        title: 'Delete',

        topLayer: true,
        text: 'Delete Was Cancel',
        ...novaSwalConfirmPrimary(),
        scrollbarPadding: false,
        ...novaSwalDarkBase(),
      });
      this.selectedGames = [];
    }
  }

  toggleGame(gameId: number) {
    const index = this.selectedGames.indexOf(gameId);
    //console.log(index);
    // -1 = not found , 1 = found
    if (index === -1) {
      this.selectedGames.push(gameId);
      //console.log('index = ', index);
    } else {
      this.selectedGames.splice(index, 1); //ลบ1 ตัวที่ตำแหน่งนั้น
      //console.log('index = ', index);
    }
    console.log('เกมที่เลือก ', this.selectedGames);
    this.gameState.gameSelectedId(this.selectedGames);
    this.cdr.detectChanges();
  }

  // isGameSelected(gameId: number): boolean {
  //   return this.selectedGames.includes(gameId);
  // }
  isGameSelected(gameId: number): boolean {
    const gameChoose = this.selectedGames.includes(gameId);
    // console.log('selected ', gameChoose);

    return gameChoose;
  }

  dialogDel() {
    this.confirm
      .open({
        title: 'Delete Game',
        message: 'คุณต้องการลบเกมที่เลือกใช่หรือไม่',
        variant: 'danger',
        confirmText: 'ลบ',
        cancelText: 'ยกเลิก',
      })
      .subscribe((status) => {
        if (status) {
          console.log('post API');

          this.gameService.deleteGames().subscribe({
            next: (resp) => {
              console.log('ค่าที่ได้ = ', resp);
              if (resp.status === 200) {
                this.isDelete = !this.isDelete;
                this.selectedGames = [];
                Swal.fire({
                  title: 'Successfully ',
                  text: 'Game was deleted',
                  topLayer: true,
                  showConfirmButton: false,
                  icon: 'success',
                  ...novaSwalConfirmPrimary(),
                  scrollbarPadding: false,
                  ...novaSwalDarkBase(),
                });

                this.gameService.clearGameCache();
                this.gameState.triggerAllGameRefresh();
                this.cdr.detectChanges();
              }
            },
            error: (err) => {
              console.error('error = ', err);
              Swal.fire({
                icon: 'error',
                title: 'Failed',
                timer: 2000,
                topLayer: true,
                showConfirmButton: false,
                text: err.error.message || 'Something went wrong',
                ...novaSwalConfirmPrimary(),
                scrollbarPadding: false,
                ...novaSwalDarkBase(),
              });
            },
          });
        }
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
