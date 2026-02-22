import { Directive, ElementRef, NgZone, OnDestroy, AfterViewInit } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appMediaRow]'
})
export class MediaRowDirective implements AfterViewInit, OnDestroy {
  private scrollEl: HTMLElement | null = null;
  private cleanupFns: Array<() => void> = [];
  private ro: ResizeObserver | null = null;
  private mo: MutationObserver | null = null;

  constructor(private host: ElementRef<HTMLElement>, private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.scrollEl = this.host.nativeElement.querySelector('.media-row') as HTMLElement | null;
    if (!this.scrollEl) return;

    const onScroll = () => this.ngZone.run(() => this.updateFadeClasses());

    // attach scroll listener outside Angular
    this.ngZone.runOutsideAngular(() => {
      this.scrollEl!.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    });
    this.cleanupFns.push(() => { this.scrollEl && this.scrollEl.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); });

    // ResizeObserver to catch content/size changes (images loading, layout shifts)
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.ngZone.run(() => this.updateFadeClasses()));
      this.ro.observe(this.scrollEl);
      this.cleanupFns.push(() => this.ro && this.ro.disconnect());
    }

    // watch for images being added or changed inside the row
    this.mo = new MutationObserver(() => this.ngZone.run(() => this.attachImageLoadListeners()));
    this.mo.observe(this.scrollEl, { childList: true, subtree: true });
    this.cleanupFns.push(() => this.mo && this.mo.disconnect());

    // attach to existing images
    this.attachImageLoadListeners();

    // initial update (run twice to cover late-loading resources)
    this.ngZone.runOutsideAngular(() => requestAnimationFrame(() => this.ngZone.run(() => this.updateFadeClasses())));
    setTimeout(() => this.updateFadeClasses(), 500);
  }

  private attachImageLoadListeners() {
    if (!this.scrollEl) return;
    const imgs = Array.from(this.scrollEl.querySelectorAll('img')) as HTMLImageElement[];
    imgs.forEach((img) => {
      const onLoad = () => this.ngZone.run(() => this.updateFadeClasses());
      img.addEventListener('load', onLoad);
      this.cleanupFns.push(() => img.removeEventListener('load', onLoad));
    });
  }

  private updateFadeClasses() {
    if (!this.scrollEl) return;
    const el = this.scrollEl;
    const canLeft = el.scrollLeft > 5;
    const canRight = (el.scrollLeft + el.clientWidth) < (el.scrollWidth - 5);

    const hostEl = this.host.nativeElement;
    hostEl.classList.toggle('has-left-fade', canLeft);
    hostEl.classList.toggle('has-right-fade', canRight);
  }

  ngOnDestroy(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }
}
