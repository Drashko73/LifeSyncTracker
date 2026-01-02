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
import { DashboardStats, TimeDistribution, MonthlyFlow } from '../../core/models';

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
  template: `
    <div class="p-4 md:p-6 bg-gray-50 min-h-screen">
      <p-toast></p-toast>
      
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-500">Welcome back! Here's your productivity overview.</p>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center h-64">
          <p-progressSpinner></p-progressSpinner>
        </div>
      } @else {
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Weekly Hours -->
          <p-card styleClass="hover-card">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 mr-4">
                <i class="pi pi-clock text-2xl text-blue-600"></i>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Weekly Hours</p>
                <p class="text-2xl font-bold text-gray-800">{{ stats()?.weeklyHours?.toFixed(1) || '0' }}</p>
              </div>
            </div>
          </p-card>

          <!-- Monthly Hours -->
          <p-card styleClass="hover-card">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 mr-4">
                <i class="pi pi-calendar text-2xl text-green-600"></i>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Monthly Hours</p>
                <p class="text-2xl font-bold text-gray-800">{{ stats()?.monthlyHours?.toFixed(1) || '0' }}</p>
              </div>
            </div>
          </p-card>

          <!-- Monthly Income -->
          <p-card styleClass="hover-card">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-emerald-100 mr-4">
                <i class="pi pi-dollar text-2xl text-emerald-600"></i>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Monthly Income</p>
                <p class="text-2xl font-bold text-emerald-600">\${{ stats()?.monthlyIncome?.toFixed(2) || '0.00' }}</p>
              </div>
            </div>
          </p-card>

          <!-- Monthly Expenses -->
          <p-card styleClass="hover-card">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-red-100 mr-4">
                <i class="pi pi-shopping-cart text-2xl text-red-600"></i>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Monthly Expenses</p>
                <p class="text-2xl font-bold text-red-600">\${{ stats()?.monthlyExpenses?.toFixed(2) || '0.00' }}</p>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Running Timer Banner -->
        @if (timeEntryService.runningTimer()) {
          <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 mb-6 text-white">
            <div class="flex flex-col md:flex-row justify-between items-center">
              <div class="flex items-center mb-4 md:mb-0">
                <div class="animate-pulse mr-4">
                  <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                </div>
                <div>
                  <p class="font-medium">Timer Running</p>
                  <p class="text-sm opacity-80">
                    {{ timeEntryService.runningTimer()?.project?.name || 'No project' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center">
                <span class="timer-display mr-4">
                  {{ timeEntryService.formatElapsedTime(timeEntryService.elapsedSeconds()) }}
                </span>
                <a routerLink="/time-tracking" class="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition">
                  View Timer
                </a>
              </div>
            </div>
          </div>
        }

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Time Distribution Pie Chart -->
          <p-card>
            <ng-template pTemplate="header">
              <div class="p-4 border-b">
                <h2 class="text-lg font-semibold text-gray-800">Time Distribution (This Month)</h2>
              </div>
            </ng-template>
            <div class="p-4">
              @if (pieChartData()) {
                <p-chart type="pie" [data]="pieChartData()" [options]="pieChartOptions"></p-chart>
              } @else {
                <div class="text-center py-8 text-gray-500">
                  <i class="pi pi-chart-pie text-4xl mb-2"></i>
                  <p>No time data available</p>
                </div>
              }
            </div>
          </p-card>

          <!-- Monthly Flow Bar Chart -->
          <p-card>
            <ng-template pTemplate="header">
              <div class="p-4 border-b">
                <h2 class="text-lg font-semibold text-gray-800">Income vs Expenses (6 Months)</h2>
              </div>
            </ng-template>
            <div class="p-4">
              @if (barChartData()) {
                <p-chart type="bar" [data]="barChartData()" [options]="barChartOptions"></p-chart>
              } @else {
                <div class="text-center py-8 text-gray-500">
                  <i class="pi pi-chart-bar text-4xl mb-2"></i>
                  <p>No financial data available</p>
                </div>
              }
            </div>
          </p-card>
        </div>

        <!-- Productivity Heatmap -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="p-4 border-b">
              <h2 class="text-lg font-semibold text-gray-800">Productivity Heatmap</h2>
            </div>
          </ng-template>
          <div class="p-4">
            @if (stats()?.productivityHeatmap && stats()!.productivityHeatmap.length > 0) {
              <div class="overflow-x-auto">
                <div class="flex flex-wrap gap-1">
                  @for (day of stats()?.productivityHeatmap; track day.date) {
                    <div 
                      class="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-110"
                      [class]="'heatmap-' + day.intensityLevel"
                      [title]="formatDate(day.date) + ': ' + day.hours.toFixed(1) + ' hours'"
                    ></div>
                  }
                </div>
                <div class="flex items-center mt-4 text-sm text-gray-500">
                  <span class="mr-2">Less</span>
                  <div class="flex gap-1">
                    <div class="w-3 h-3 rounded-sm heatmap-0"></div>
                    <div class="w-3 h-3 rounded-sm heatmap-1"></div>
                    <div class="w-3 h-3 rounded-sm heatmap-2"></div>
                    <div class="w-3 h-3 rounded-sm heatmap-3"></div>
                    <div class="w-3 h-3 rounded-sm heatmap-4"></div>
                  </div>
                  <span class="ml-2">More</span>
                </div>
              </div>
            } @else {
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-th-large text-4xl mb-2"></i>
                <p>No productivity data available</p>
              </div>
            }
          </div>
        </p-card>

        <!-- Quick Actions -->
        <div class="mt-6 flex flex-wrap gap-4">
          <a routerLink="/time-tracking">
            <p-button label="Track Time" icon="pi pi-clock" severity="primary"></p-button>
          </a>
          <a routerLink="/finance">
            <p-button label="Add Transaction" icon="pi pi-dollar" severity="success"></p-button>
          </a>
          <a routerLink="/time-tracking/projects">
            <p-button label="Manage Projects" icon="pi pi-folder" severity="info"></p-button>
          </a>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  protected timeEntryService = inject(TimeEntryService);
  private messageService = inject(MessageService);

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
}
