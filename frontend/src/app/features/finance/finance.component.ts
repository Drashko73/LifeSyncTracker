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
  template: `
    <div class="p-4 md:p-6 bg-gray-50 min-h-screen">
      <p-toast></p-toast>
      <p-confirmdialog></p-confirmdialog>

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Finance Tracking</h1>
          <p class="text-gray-500">Track your income and expenses</p>
        </div>
        <div class="mt-4 md:mt-0">
          <p-button 
            label="Add Transaction" 
            icon="pi pi-plus" 
            (onClick)="showAddTransactionDialog()"
          ></p-button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <p-card styleClass="hover-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Total Income (Last 12 Months)</p>
              <p class="text-2xl font-bold text-green-600">\${{ summary()?.totalIncome?.toFixed(2) || '0.00' }}</p>
            </div>
            <div class="p-3 rounded-full bg-green-100">
              <i class="pi pi-arrow-up text-2xl text-green-600"></i>
            </div>
          </div>
        </p-card>

        <p-card styleClass="hover-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Total Expenses</p>
              <p class="text-2xl font-bold text-red-600">\${{ summary()?.totalExpenses?.toFixed(2) || '0.00' }}</p>
            </div>
            <div class="p-3 rounded-full bg-red-100">
              <i class="pi pi-arrow-down text-2xl text-red-600"></i>
            </div>
          </div>
        </p-card>

        <p-card styleClass="hover-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Net Balance</p>
              <p class="text-2xl font-bold" [class]="(summary()?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                \${{ summary()?.netBalance?.toFixed(2) || '0.00' }}
              </p>
            </div>
            <div class="p-3 rounded-full" [class]="(summary()?.netBalance || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'">
              <i class="pi pi-wallet text-2xl" [class]="(summary()?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'"></i>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Filters -->
      <p-card class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <p-select 
              [options]="userPreferencesService.getFilterPeriodOptions()" 
              [(ngModel)]="filterPeriod" 
              optionLabel="label" 
              optionValue="value"
              styleClass="w-full"
              (onChange)="onFilterPeriodChange()"
            ></p-select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <p-select 
              [options]="transactionTypes" 
              [(ngModel)]="filterType" 
              optionLabel="label" 
              optionValue="value"
              placeholder="All Types"
              [showClear]="true"
              styleClass="w-full"
              (onChange)="loadTransactions()"
            ></p-select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <p-select 
              [options]="categories()" 
              [(ngModel)]="filterCategoryId" 
              optionLabel="name" 
              optionValue="id"
              placeholder="All Categories"
              [showClear]="true"
              styleClass="w-full"
              (onChange)="loadTransactions()"
            ></p-select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <p-datepicker 
              [(ngModel)]="filterStartDate" 
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
              (onSelect)="loadTransactions()"
            ></p-datepicker>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <p-datepicker 
              [(ngModel)]="filterEndDate" 
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
              (onSelect)="loadTransactions()"
            ></p-datepicker>
          </div>
          <div class="flex items-end">
            <p-button label="Clear" icon="pi pi-times" severity="secondary" (onClick)="clearFilters()"></p-button>
          </div>
        </div>
      </p-card>

      <!-- Transactions Table -->
      <p-card>
        <ng-template pTemplate="header">
          <div class="p-4 border-b flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-800">Transactions</h2>
          </div>
        </ng-template>
        
        @if (isLoading()) {
          <div class="flex justify-center items-center h-32">
            <p-progressSpinner></p-progressSpinner>
          </div>
        } @else {
          <p-table 
            [value]="transactions()" 
            [paginator]="true" 
            [rows]="10"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} transactions"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-transaction>
              <tr>
                <td>{{ formatDate(transaction.date) }}</td>
                <td>
                  <span 
                    class="px-2 py-1 rounded text-sm inline-flex items-center"
                    [style.backgroundColor]="transaction.category.colorCode || '#e5e7eb'"
                    [style.color]="getContrastColor(transaction.category.colorCode)"
                  >
                    <i [class]="transaction.category.icon + ' mr-1'" *ngIf="transaction.category.icon"></i>
                    {{ transaction.category.name }}
                  </span>
                </td>
                <td class="max-w-xs truncate">{{ transaction.description || '-' }}</td>
                <td>
                  <span [class]="transaction.category.type === 0 ? 'text-green-600' : 'text-red-600'" class="font-semibold">
                    {{ transaction.category.type === 0 ? '+' : '-' }}{{ formatCurrency(transaction.amount, transaction.currency) }}
                  </span>
                  @if (transaction.isAutoGenerated) {
                    <span class="ml-2 text-xs text-gray-400">(auto)</span>
                  }
                </td>
                <td>
                  <div class="flex gap-2">
                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (onClick)="editTransaction(transaction)"></p-button>
                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDelete(transaction)"></p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                  No transactions found. Add your first transaction!
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>

      <!-- Add/Edit Transaction Dialog -->
      <p-dialog 
        [header]="editingTransaction ? 'Edit Transaction' : 'Add Transaction'" 
        [(visible)]="showTransactionDialog" 
        [modal]="true" 
        [style]="{width: '450px'}"
        [closable]="true"
      >
        <form [formGroup]="transactionForm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <p-select 
              [options]="categories()" 
              formControlName="categoryId" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Select a category"
              class="w-full"
            >
              <ng-template let-category pTemplate="item">
                <div class="flex items-center">
                  @if (category.icon) {
                    <i [class]="category.icon + ' mr-2'"></i>
                  }
                  <span>{{ category.name }}</span>
                  <span class="ml-2 text-xs text-gray-400">
                    ({{ category.type === 0 ? 'Income' : 'Expense' }})
                  </span>
                </div>
              </ng-template>
            </p-select>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <p-inputnumber 
                formControlName="amount" 
                [min]="0.01"
                styleClass="w-full"
              ></p-inputnumber>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <p-select 
                [options]="currencies" 
                formControlName="currency" 
                optionLabel="label" 
                optionValue="value"
                styleClass="w-full"
              ></p-select>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <p-datepicker 
              formControlName="date" 
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
            ></p-datepicker>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input 
              pInputText 
              formControlName="description" 
              class="w-full"
              placeholder="Optional description"
            />
          </div>
        </form>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" (onClick)="showTransactionDialog = false"></p-button>
          <p-button 
            [label]="editingTransaction ? 'Update' : 'Save'" 
            icon="pi pi-check" 
            (onClick)="saveTransaction()"
            [disabled]="transactionForm.invalid"
          ></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `
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
      page: 1,
      pageSize: 100
    };

    this.transactionService.getAll(filter).subscribe({
      next: (response) => {
        console.log(response);
        if (response.success && response.data) {
          this.transactions.set(response.data.items);
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

    this.transactionService.getSummary(startDate, endDate).subscribe({
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
}
