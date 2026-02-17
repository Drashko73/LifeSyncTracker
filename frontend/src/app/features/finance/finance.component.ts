import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TransactionService } from '../../core/services/transaction.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { Transaction, TransactionCategory, TransactionType, Currency, TransactionFilterDto, FinancialSummary, ApiResponse, PaginatedResponse } from '../../core/models';

/**
 * Finance component for managing transactions and categories.
 */
@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumber,
    Select,
    DatePicker,
    ToastModule,
    ConfirmDialog,
    ProgressSpinnerModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './finance.component.html'
})
export class FinanceComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  protected userPreferencesService = inject(UserPreferencesService);

  isLoading = signal(true);
  transactions = signal<Transaction[]>([]);
  categories = signal<TransactionCategory[]>([]);
  summary = signal<FinancialSummary | null>(null);

  showTransactionDialog = false;
  editingTransaction: Transaction | null = null;

  filterPeriod: number = 6;
  filterType: TransactionType | null = null;
  filterCategoryId: number | null = null;
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

  totalRecords: number = 0;
  currentPage: number = 1;
  first: number = 0;
  last: number = 0;
  rows: number = 10;

  transactionTypes = [
    { label: 'Income', value: TransactionType.Income },
    { label: 'Expense', value: TransactionType.Expense }
  ];

  currencies = [
    { label: 'USD ($)', value: Currency.USD },
    { label: 'EUR (€)', value: Currency.EUR },
    { label: 'RSD (дин.)', value: Currency.RSD }
  ];

  transactionForm = this.fb.group({
    categoryId: [null as number | null, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.USD],
    date: [new Date(), Validators.required],
    description: ['']
  });

  ngOnInit(): void {
    // Initialize from user preferences
    this.filterPeriod = this.userPreferencesService.defaultFilterMonths();
    this.applyFilterPeriod();
    
    // Set default currency from preferences
    this.transactionForm.patchValue({
      currency: this.userPreferencesService.currency()
    });
    
    this.loadCategories();
    this.loadTransactions();
    this.loadSummary();
  }

  private loadCategories(): void {
    this.transactionService.getCategories().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories.set(response.data);
        }
      }
    });
  }

  onFilterPeriodChange(): void {
    this.applyFilterPeriod();
    this.loadTransactions();
  }

  private applyFilterPeriod(): void {
    const { startDate, endDate } = this.userPreferencesService.getDateRangeForPeriod(this.filterPeriod);
    this.filterStartDate = startDate;
    this.filterEndDate = endDate;
  }

  loadTransactions(): void {
    this.isLoading.set(true);
    const filter: TransactionFilterDto = {
      type: this.filterType !== null ? this.filterType : undefined,
      categoryId: this.filterCategoryId || undefined,
      startDate: this.filterStartDate || undefined,
      endDate: this.filterEndDate || undefined,
      page: this.currentPage,
      pageSize: this.rows
    };

    this.transactionService.getAll(filter).subscribe({
      next: (response) => {
        console.log(response);
        if (response.success && response.data) {
          this.transactions.set(response.data.items);
          this.totalRecords = response.data.totalCount;
            this.currentPage = response.data.page;
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load transactions'
        });
      }
    });

    this.loadSummary();
  }

  private loadSummary(): void {
    const startDate = this.filterStartDate || new Date(new Date().getFullYear(), new Date().getMonth()-12, 1);
    const endDate = this.filterEndDate || new Date();

    // Adjust endDate to include the entire day
    const newEndDate = new Date(endDate);
    newEndDate.setDate(newEndDate.getDate() + 1);

    this.transactionService.getSummary(startDate, newEndDate).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.summary.set(response.data);
        }
      }
    });
  }

  clearFilters(): void {
    this.filterPeriod = this.userPreferencesService.defaultFilterMonths();
    this.filterType = null;
    this.filterCategoryId = null;
    this.first = 0;
    this.currentPage = 1;
    this.applyFilterPeriod();
    this.loadTransactions();
  }

  showAddTransactionDialog(): void {
    this.editingTransaction = null;
    this.transactionForm.reset({
      categoryId: null,
      amount: 0,
      currency: this.userPreferencesService.currency(),
      date: new Date(),
      description: ''
    });
    this.showTransactionDialog = true;
  }

  editTransaction(transaction: Transaction): void {
    this.editingTransaction = transaction;
    this.transactionForm.patchValue({
      categoryId: transaction.category.id,
      amount: transaction.amount,
      currency: transaction.currency ?? Currency.USD,
      date: new Date(transaction.date),
      description: transaction.description || ''
    });
    this.showTransactionDialog = true;
  }

  saveTransaction(): void {
    if (this.transactionForm.invalid) return;

    const formValue = this.transactionForm.value;

    if (this.editingTransaction) {
      this.transactionService.update(this.editingTransaction.id, {
        categoryId: formValue.categoryId!,
        amount: formValue.amount!,
        currency: formValue.currency ?? Currency.USD,
        date: formValue.date!,
        description: formValue.description || undefined
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.showTransactionDialog = false;
            this.loadTransactions();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Transaction updated'
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update transaction'
          });
        }
      });
    } else {
      this.transactionService.create({
        categoryId: formValue.categoryId!,
        amount: formValue.amount!,
        currency: formValue.currency ?? Currency.USD,
        date: formValue.date!,
        description: formValue.description || undefined
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.showTransactionDialog = false;
            this.loadTransactions();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Transaction created'
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create transaction'
          });
        }
      });
    }
  }

  confirmDelete(transaction: Transaction): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this transaction?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteTransaction(transaction.id);
      }
    });
  }

  private deleteTransaction(id: number): void {
    this.transactionService.delete(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadTransactions();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Transaction deleted'
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete transaction'
        });
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number, currency?: Currency): string {
    const currencyCode = currency ?? Currency.USD;
    switch (currencyCode) {
      case Currency.USD:
        return `$${amount.toFixed(2)}`;
      case Currency.EUR:
        return `€${amount.toFixed(2)}`;
      case Currency.RSD:
        return `${amount.toFixed(2)} дин.`;
      default:
        return `$${amount.toFixed(2)}`;
    }
  }

  getContrastColor(hexColor: string | undefined): string {
    if (!hexColor) return '#000000';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  pageChange(event: any): void {
    const newPage = Math.floor(event.first / event.rows) + 1;
    if (newPage === this.currentPage && event.rows === this.rows) return;
    this.currentPage = newPage;
    this.first = event.first;
    this.rows = event.rows;
    this.loadTransactions();
  }
}
