import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateToastComponent } from './update-toast.component';
import { UpdateService } from '../../services/update.service';

describe('UpdateToastComponent', () => {
  let component: UpdateToastComponent;
  let fixture: ComponentFixture<UpdateToastComponent>;
  let updateService: UpdateService;

  beforeEach(async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ offline: true })
      })
    );

    await TestBed.configureTestingModule({
      imports: [UpdateToastComponent],
      providers: [UpdateService]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateToastComponent);
    component = fixture.componentInstance;
    updateService = TestBed.inject(UpdateService);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should not be visible when no update is available', () => {
    updateService.updateAvailable.set(false);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.update-toast-banner');
    expect(banner).toBeNull();
  });

  it('should display when update is available', () => {
    updateService.updateAvailable.set(true);
    updateService.updateReason.set('dataset');
    updateService.remoteVersion.set({
      appVersion: '1.2.0',
      buildHash: 'test-hash',
      builtAt: Date.now(),
      datasetVersion: 2,
      wordsCount: 6175
    });
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.update-toast-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('6\u202F175 mots curatés');
  });

  it('should call dismiss when clicking close button', () => {
    updateService.updateAvailable.set(true);
    fixture.detectChanges();

    const dismissSpy = vi.spyOn(updateService, 'dismiss');
    const dismissBtn = fixture.nativeElement.querySelector('.dismiss-btn');
    dismissBtn.click();

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should call applyUpdate when clicking refresh button', () => {
    updateService.updateAvailable.set(true);
    fixture.detectChanges();

    const applySpy = vi.spyOn(updateService, 'applyUpdate');
    const refreshBtn = fixture.nativeElement.querySelector('.refresh-btn');
    refreshBtn.click();

    expect(applySpy).toHaveBeenCalled();
  });
});
