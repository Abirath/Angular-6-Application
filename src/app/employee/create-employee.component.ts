import { Component, OnInit } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  FormArray,
  FormControl,
} from "@angular/forms";
import { formControlBinding } from "@angular/forms/src/directives/ng_model";
import { CustomValidators } from "../shared/custom.validators";
import { ActivatedRoute } from "@angular/router";
import { EmployeeService } from "./employee.service";
import { IEmployee } from "./IEmployee";
import { ISkill } from "./ISKill";
import { Router } from "@angular/router";

@Component({
  selector: "app-create-employee",
  templateUrl: "./create-employee.component.html",
  styleUrls: ["./create-employee.component.css"],
})
export class CreateEmployeeComponent implements OnInit {
  employeeForm: FormGroup;
  employee: IEmployee;
  pageTitle: string;

  // This object contains all the validation messages for this form
  validationMessages = {
    fullName: {
      required: "Full Name is required.",
      minlength: "Full Name must be greater than 2 characters.",
      maxlength: "Full Name must be less than 10 characters.",
    },
    email: {
      required: "Email is required.",
      emailDomain: "Email domain should be gmail.com",
    },
    confirmEmail: {
      required: "Confirm Email is required.",
    },
    emailGroup: {
      emailMismatch: "Email and Confirm Email do not match.",
    },
    phone: {
      required: "Phone is required.",
    },
  };

  // This object will hold the messages to be displayed to the user
  // Notice, each key in this object has the same name as the
  // corresponding form control
  formErrors = {};

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.employeeForm = this.fb.group({
      fullName: [
        "",
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(10),
        ],
      ],
      contactPreference: ["email"],
      emailGroup: this.fb.group(
        {
          email: [
            "",
            [Validators.required, CustomValidators.emailDomain("gmail.com")],
          ],
          confirmEmail: ["", Validators.required],
        },
        { validator: matchEmails }
      ),
      phone: [""],
      skills: this.fb.array([this.addSkillFormGroup()]),
    });

    this.employeeForm
      .get("contactPreference")
      .valueChanges.subscribe((data: string) => {
        this.onContactPrefernceChange(data);
      });

    this.employeeForm.valueChanges.subscribe((data) => {
      this.logValidationErrors(this.employeeForm);
    });

    this.route.paramMap.subscribe((params) => {
      const empId = +params.get("id");
      if (empId) {
        this.pageTitle = "Edit Employee";
        this.getEmployee(empId);
      } else {
        this.pageTitle = "Create Employee";
        this.employee = {
          id: null,
          fullName: "",
          contactPreference: "",
          email: "",
          phone: null,
          skills: [],
        };
      }
    });
  }

  getEmployee(id: number) {
    this.employeeService.getEmployee(id).subscribe(
      (employee: IEmployee) => {
        this.editEmployee(employee);
        this.employee = employee;
      },
      (err: any) => console.log(err)
    );
  }

  editEmployee(employee: IEmployee) {
    this.employeeForm.patchValue({
      fullName: employee.fullName,
      contactPreference: employee.contactPreference,
      emailGroup: {
        email: employee.email,
        confirmEmail: employee.email,
      },
      phone: employee.phone,
    });

    this.employeeForm.setControl(
      "skills",
      this.setExistingSkills(employee.skills)
    );
  }

  setExistingSkills(skillSets: ISkill[]): FormArray {
    const formArray = new FormArray([]);
    skillSets.forEach((s) => {
      formArray.push(
        this.fb.group({
          skillName: s.skillName,
          experienceInYears: s.experienceInYears,
          proficiency: s.proficiency,
        })
      );
    });

    return formArray;
  }

  addSkillButtonClick(): void {
    (<FormArray>this.employeeForm.get("skills")).push(this.addSkillFormGroup());
  }

  removeSkillButtonClick(skillGroupIndex: number): void {
    const skillsFormArray = <FormArray>this.employeeForm.get("skills");
    skillsFormArray.removeAt(skillGroupIndex);
    skillsFormArray.markAsDirty();
    skillsFormArray.markAsTouched();
  }

  addSkillFormGroup(): FormGroup {
    return this.fb.group({
      skillName: ["", Validators.required],
      experienceInYears: ["", Validators.required],
      proficiency: ["", Validators.required],
    });
  }

  // If the Selected Radio Button value is "phone", then add the
  // required validator function otherwise remove it
  onContactPrefernceChange(selectedValue: string) {
    const phoneFormControl = this.employeeForm.get("phone");
    if (selectedValue === "phone") {
      phoneFormControl.setValidators(Validators.required);
    } else {
      phoneFormControl.clearValidators();
    }
    phoneFormControl.updateValueAndValidity();
  }

  logValidationErrors(group: FormGroup = this.employeeForm): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);

      this.formErrors[key] = "";
      if (
        abstractControl &&
        !abstractControl.valid &&
        (abstractControl.touched ||
          abstractControl.dirty ||
          abstractControl.value !== "")
      ) {
        const messages = this.validationMessages[key];

        for (const errorkey in abstractControl.errors) {
          if (errorkey) {
            this.formErrors[key] += messages[errorkey] + " ";
          }
        }
      }

      if (abstractControl instanceof FormGroup) {
        this.logValidationErrors(abstractControl);
      }
    });
  }

  onLoadDataClick(): void {
    const formArray1 = this.fb.array([
      new FormControl("John", Validators.required),
      new FormControl("IT", Validators.required),
      new FormControl("Male", Validators.required),
    ]);

    const FormGroup = this.fb.group([
      new FormControl("John", Validators.required),
      new FormControl("IT", Validators.required),
      new FormControl("Male", Validators.required),
    ]);

    console.log(formArray1);
    console.log(FormGroup);
  }

  onSubmit(): void {
    this.mapFormValuesToEmployeeModel();
    if (this.employee.id) {
      this.employeeService.updateEmployee(this.employee).subscribe(
        () => this.router.navigate(["employees"]),
        (err: any) => console.log(err)
      );
    } else {
      this.employeeService.addEmployee(this.employee).subscribe(
        () => this.router.navigate(["employees"]),
        (err: any) => console.log(err)
      );
    }
  }

  mapFormValuesToEmployeeModel() {
    this.employee.fullName = this.employeeForm.value.fullName;
    this.employee.contactPreference = this.employeeForm.value.contactPreference;
    this.employee.email = this.employeeForm.value.emailGroup.email;
    this.employee.phone = this.employeeForm.value.phone;
    this.employee.skills = this.employeeForm.value.skills;
  }
}

// Nested form group (emailGroup) is passed as a parameter. Retrieve email and
// confirmEmail form controls. If the values are equal return null to indicate
// validation passed otherwise an object with emailMismatch key. Please note we
// used this same key in the validationMessages object against emailGroup
// property to store the corresponding validation error message
function matchEmails(group: AbstractControl): { [key: string]: any } | null {
  const emailControl = group.get("email");
  const confirmEmailControl = group.get("confirmEmail");

  if (
    emailControl.value === confirmEmailControl.value ||
    (confirmEmailControl.pristine && confirmEmailControl.value === "")
  ) {
    return null;
  } else {
    return { emailMismatch: true };
  }
}
