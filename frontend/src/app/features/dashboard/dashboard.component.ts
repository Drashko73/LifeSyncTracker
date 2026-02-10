import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { DashboardService } from '../../core/services/dashboard.service';
import { TimeEntryService } from '../../core/services/time-entry.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { DashboardStats, TimeDistribution, MonthlyFlow, Currency } from '../../core/models';

/**
 * Dashboard component showing overview statistics and charts.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    ChartModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  protected timeEntryService = inject(TimeEntryService);
  private messageService = inject(MessageService);
  protected userPreferencesService = inject(UserPreferencesService);

  isLoading = signal(true);
  stats = signal<DashboardStats | null>(null);
  pieChartData = signal<any>(null);
  barChartData = signal<any>(null);

  pieChartOptions = {
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  barChartOptions = {
    plugins: {
      legend: {
        position: 'top'
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Loads dashboard statistics and prepares chart data.
   */
  private loadDashboardData(): void {
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.set(response.data);
          this.preparePieChartData(response.data.timeDistribution);
          this.prepareBarChartData(response.data.monthlyFlow);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load dashboard data'
        });
      }
    });
  }

  /**
   * Prepares pie chart data from time distribution.
   */
  private preparePieChartData(distribution: TimeDistribution[]): void {
    if (!distribution || distribution.length === 0) {
      this.pieChartData.set(null);
      return;
    }

    this.pieChartData.set({
      labels: distribution.map(d => d.projectName),
      datasets: [{
        data: distribution.map(d => d.totalHours),
        backgroundColor: distribution.map(d => d.colorCode || this.getRandomColor()),
        hoverBackgroundColor: distribution.map(d => d.colorCode || this.getRandomColor())
      }]
    });
  }

  /**
   * Prepares bar chart data from monthly flow.
   */
  private prepareBarChartData(flow: MonthlyFlow[]): void {
    if (!flow || flow.length === 0) {
      this.barChartData.set(null);
      return;
    }

    this.barChartData.set({
      labels: flow.map(f => f.label),
      datasets: [
        {
          label: 'Income',
          data: flow.map(f => f.income),
          backgroundColor: '#22C55E'
        },
        {
          label: 'Expenses',
          data: flow.map(f => f.expenses),
          backgroundColor: '#EF4444'
        }
      ]
    });
  }

  /**
   * Generates a random color for charts.
   */
  private getRandomColor(): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Formats a date for display.
   */
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
}
