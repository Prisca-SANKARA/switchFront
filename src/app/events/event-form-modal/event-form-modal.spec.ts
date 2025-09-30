import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventFormModal } from './event-form-modal';

describe('EventFormModal', () => {
  let component: EventFormModal;
  let fixture: ComponentFixture<EventFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFormModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventFormModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
