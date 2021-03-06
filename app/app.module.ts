import { NgModule }             from '@angular/core';
import { BrowserModule }        from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { RouterModule, Routes } from '@angular/router';
import { FormsModule }          from '@angular/forms';
import { FlexLayoutModule }     from '@angular/flex-layout';

import { NgbModule }            from '@ng-bootstrap/ng-bootstrap';
import { ChartsModule }         from 'ng2-charts/ng2-charts';

import { PartoutMaterialModule } from './partout-material.module';

import { AppComponent }         from './app.component';
import { LoginFormComponent }   from './login/login-form.component';

import { P2TableComponent }     from './tables/p2table.component';
import { ViewAgentComponent }   from './agents/viewAgent.component';
import { ViewCsrComponent }     from './csrs/viewCsr.component';
import { ViewIssueComponent }     from './issues/viewIssue.component';
import { UserComponent }        from './users/user.component';
import { RoleComponent }        from './roles/role.component';
import { EnvRepoMgmtComponent } from './environments/env-repo-mgmt.component';

import { P2DashboardComponent } from './dashboard/p2dashboard.component';

import { PieChartComponent }    from './charts/piechart.component';
import { BucketsChartComponent } from './charts/bucketschart.component';

import { ViewLogDialogComponent } from './common/dialogs/view-log-dialog.component';
import { OkCancelDialogComponent } from './common/dialogs/ok-cancel-dialog.component';

import { CollapsableViewComponent } from './common/views/collapsable-view.component';

import { DefaultPipe }          from './common/pipes/default.pipe';

import { HasPermissionGuard }   from './common/guards/rbac.guard';

// Feathers Services
import { ServicesModule }       from './services/services.module';
import { ToolbarModule }        from './toolbar/toolbar.module';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    PartoutMaterialModule,
    NgbModule.forRoot(),
    ChartsModule,
    FormsModule,
    FlexLayoutModule,

    ServicesModule,
    ToolbarModule
  ],
  declarations: [
    AppComponent,
    P2TableComponent,
    LoginFormComponent,
    ViewAgentComponent,
    ViewCsrComponent,
    ViewIssueComponent,

    ViewLogDialogComponent,
    OkCancelDialogComponent,
    CollapsableViewComponent,

    P2DashboardComponent,

    PieChartComponent,
    BucketsChartComponent,

    UserComponent,
    RoleComponent,
    EnvRepoMgmtComponent,

    DefaultPipe
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    HasPermissionGuard
//    AgentTabClass
  ],
  entryComponents: [
    ViewAgentComponent,
    ViewCsrComponent,
    ViewIssueComponent,
    UserComponent,
    RoleComponent,
    EnvRepoMgmtComponent,
    ViewLogDialogComponent,
    OkCancelDialogComponent
  ]
})
export class AppModule { }
