import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Input } from '@angular/core';
@Directive({
  selector: '[appFadeRight]',
})
export class FadeRight {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}
  @Input() fadeInDelay: string = '0s'; //

  ngOnInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateX(-150px)');

    this.renderer.setStyle(
      this.el.nativeElement,
      'transition',
      `opacity 0.6s ease, transform 0.6s ease ${this.fadeInDelay}`,
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
            this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateX(0)');
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(this.el.nativeElement);
  }
}
