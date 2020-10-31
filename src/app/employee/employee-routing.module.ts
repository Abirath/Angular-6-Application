import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ListEmployeesComponent } from "./list-employees.component";
import { CreateEmployeeComponent } from "./create-employee.component";

const appRoutes: Routes = [
  //Updated Grouping to Lazy load --
  //Removed Children object to match the Routing path

  { path: "", component: ListEmployeesComponent },
  { path: "create", component: CreateEmployeeComponent },
  { path: "edit/:id", component: CreateEmployeeComponent },
];

@NgModule({
  imports: [RouterModule.forChild(appRoutes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {}
