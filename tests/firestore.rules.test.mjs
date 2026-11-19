import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const PROJECT_ID = "demo-origen-medico";
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8")
    }
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "users/patient-a"), { patientId: "patient-a" });
    await setDoc(doc(db, "users/patient-b"), { patientId: "patient-b" });

    await setDoc(doc(db, "patients/patient-a"), {
      displayName: "Paciente A",
      status: "active",
      accountStatus: "linked",
      linkedUid: "patient-a"
    });
    await setDoc(doc(db, "patients/patient-b"), {
      displayName: "Paciente B",
      status: "active",
      accountStatus: "linked",
      linkedUid: "patient-b"
    });

    await setDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/users/preview-patient-a"), {
      patientId: "preview-patient-a"
    });
    await setDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/users/preview-patient-b"), {
      patientId: "preview-patient-b"
    });
    await setDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a"), {
      displayName: "Paciente Preview A", accountStatus: "linked", linkedUid: "preview-patient-a"
    });
    await setDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-b"), {
      displayName: "Paciente Preview B", accountStatus: "linked", linkedUid: "preview-patient-b"
    });
    await setDoc(doc(db, "previewEnvironments/otro-entorno/patients/preview-patient-a"), {
      displayName: "Registro de otro entorno", accountStatus: "linked", linkedUid: "preview-patient-a"
    });

    // Seed protected Preview fixtures in the initial disabled-rules setup.
    // This avoids reopening a Firestore instance after its settings are locked.
    await setDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/doctorNotes/private-1"), {
      note: "internal"
    });
    await setDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/measurements/metric-1"), {
      weightKg: 80
    });

    await setDoc(doc(db, "publicContent/home"), {
      title: "ORIGEN Médico"
    });
    await setDoc(doc(db, "patients/patient-a/doctorNotes/note-1"), {
      note: "Nota interna de prueba"
    });
    await setDoc(doc(db, "patients/patient-a/prescriptions/rx-1"), {
      medication: "Medicamento de prueba"
    });
  });
});

after(async () => {
  if (testEnv) await testEnv.cleanup();
});

test("visitor can read public content but cannot read patient records", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(db, "publicContent/home")));
  await assertFails(getDoc(doc(db, "patients/patient-a")));
  await assertFails(getDocs(collection(db, "patients")));
});

test("doctor with admin claim can list and manage patient records", async () => {
  const db = testEnv.authenticatedContext("doctor-uid", { admin: true, email_verified: true }).firestore();

  await assertSucceeds(getDocs(collection(db, "patients")));
  await assertSucceeds(getDoc(doc(db, "patients/patient-a")));
  await assertSucceeds(
    setDoc(doc(db, "patients/patient-a/measurements/metric-1"), {
      weightKg: 80,
      waistCm: 92
    })
  );
});

test("patient can read only the record linked to their own UID", async () => {
  const db = testEnv.authenticatedContext("patient-a", { email_verified: true }).firestore();

  await assertSucceeds(getDoc(doc(db, "users/patient-a")));
  await assertSucceeds(getDoc(doc(db, "patients/patient-a")));
  await assertFails(getDoc(doc(db, "patients/patient-b")));
  await assertFails(getDocs(collection(db, "patients")));
});

test("patient can append a valid symptom report to their own record", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();

  await assertSucceeds(
    addDoc(collection(db, "patients/patient-a/symptomReports"), {
      symptom: "nausea",
      severity: 3,
      durationMinutes: 60,
      notes: "Molestia posterior a la comida",
      occurredAt: serverTimestamp(),
      createdAt: serverTimestamp()
    })
  );
});

test("patient cannot create a symptom report for another patient or with invalid severity", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();

  await assertFails(
    addDoc(collection(db, "patients/patient-b/symptomReports"), {
      symptom: "nausea",
      severity: 3,
      durationMinutes: 60,
      notes: "",
      occurredAt: serverTimestamp(),
      createdAt: serverTimestamp()
    })
  );

  await assertFails(
    addDoc(collection(db, "patients/patient-a/symptomReports"), {
      symptom: "nausea",
      severity: 8,
      durationMinutes: 60,
      notes: "",
      occurredAt: serverTimestamp(),
      createdAt: serverTimestamp()
    })
  );
});

test("patient can append a bounded daily log to their own record", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();
  const dateKey = "2026-11-17";

  await assertSucceeds(
    setDoc(doc(db, `patients/patient-a/dailyLogs/${dateKey}`), {
      dateKey,
      proteinGrams: 90,
      waterMl: 2100,
      electrolytesTaken: false,
      createdAt: serverTimestamp()
    })
  );
});

test("patient daily log accepts meal check-ins and bounded activity minutes", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();

  await assertSucceeds(
    setDoc(doc(db, "patients/patient-a/dailyLogs/2026-11-19"), {
      dateKey: "2026-11-19",
      proteinGrams: 95,
      waterMl: 2200,
      electrolytesTaken: false,
      meals: { breakfast: true, lunch: true, dinner: false, snacks: true },
      activityMinutes: 35,
      createdAt: serverTimestamp()
    })
  );
});

test("patient daily log rejects invalid meals, activity and unexpected fields", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();
  const base = {
    dateKey: "2026-11-19",
    proteinGrams: 95,
    waterMl: 2200,
    electrolytesTaken: false,
    createdAt: serverTimestamp()
  };

  await assertFails(setDoc(doc(db, "patients/patient-a/dailyLogs/bad-meals"), {
    ...base, meals: { breakfast: "yes", lunch: true, dinner: false }
  }));
  await assertFails(setDoc(doc(db, "patients/patient-a/dailyLogs/bad-activity"), {
    ...base, activityMinutes: 1441
  }));
  await assertFails(setDoc(doc(db, "patients/patient-a/dailyLogs/extra-field"), {
    ...base, calories: 2000
  }));
});

test("patient can create daily logs only for their own patient record", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();
  const payload = {
    dateKey: "2026-11-19",
    proteinGrams: 80,
    waterMl: 1800,
    electrolytesTaken: false,
    meals: { breakfast: true, lunch: false, dinner: false },
    activityMinutes: 20,
    createdAt: serverTimestamp()
  };

  await assertFails(setDoc(doc(db, "patients/patient-b/dailyLogs/2026-11-19"), payload));
});

test("Preview patient can append a valid daily log only in their own Preview record", async () => {
  const db = testEnv.authenticatedContext("preview-patient-a").firestore();
  const payload = {
    dateKey: "2026-11-19",
    proteinGrams: 80,
    waterMl: 1800,
    electrolytesTaken: false,
    meals: { breakfast: true, lunch: true, dinner: false },
    activityMinutes: 20,
    createdAt: serverTimestamp()
  };

  await assertSucceeds(setDoc(
    doc(db, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/dailyLogs/2026-11-19"),
    payload
  ));
  await assertFails(setDoc(
    doc(db, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-b/dailyLogs/2026-11-19"),
    payload
  ));
  await assertFails(setDoc(
    doc(db, "previewEnvironments/otro-entorno/patients/preview-patient-a/dailyLogs/2026-11-19"),
    payload
  ));
});

test("patient cannot read internal doctor notes or write prescriptions", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();

  await assertFails(getDoc(doc(db, "patients/patient-a/doctorNotes/note-1")));
  await assertSucceeds(getDoc(doc(db, "patients/patient-a/prescriptions/rx-1")));
  await assertFails(
    setDoc(doc(db, "patients/patient-a/prescriptions/forged"), {
      medication: "No autorizado"
    })
  );
});

test("patient cannot assign their own patientId or role", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();

  await assertFails(
    setDoc(doc(db, "users/patient-a"), {
      patientId: "patient-b",
      role: "doctor"
    })
  );
});


test("patient cannot read another user's private account mapping", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();

  await assertFails(getDoc(doc(db, "users/patient-b")));
  await assertFails(getDocs(collection(db, "users")));
});

test("patient daily logs are append-only", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();
  const logRef = doc(db, "patients/patient-a/dailyLogs/log-1");

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "patients/patient-a/dailyLogs/log-1"), {
      dateKey: "2026-11-17",
      proteinGrams: 90,
      waterMl: 2100,
      electrolytesTaken: false,
      createdAt: new Date()
    });
  });

  await assertFails(updateDoc(logRef, { waterMl: 2500 }));
  await assertFails(deleteDoc(logRef));
});

test("patient symptom reports and prescription requests cannot be altered or deleted", async () => {
  const db = testEnv.authenticatedContext("patient-a").firestore();
  const symptomRef = doc(db, "patients/patient-a/symptomReports/symptom-1");
  const requestRef = doc(db, "patients/patient-a/prescriptionRequests/request-1");

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, "patients/patient-a/symptomReports/symptom-1"), {
      symptom: "nausea",
      severity: 2,
      durationMinutes: 30,
      notes: "",
      occurredAt: new Date(),
      createdAt: new Date()
    });
    await setDoc(doc(adminDb, "patients/patient-a/prescriptionRequests/request-1"), {
      category: "consulta",
      requestedProduct: "",
      message: "Necesito hablar con mi médico",
      status: "pending",
      createdAt: new Date()
    });
  });

  await assertFails(updateDoc(symptomRef, { severity: 1 }));
  await assertFails(deleteDoc(symptomRef));
  await assertFails(updateDoc(requestRef, { status: "approved" }));
  await assertFails(deleteDoc(requestRef));
});

test("only an administrator can read audit logs and internal notes", async () => {
  const patientDb = testEnv.authenticatedContext("patient-a").firestore();
  const adminDb = testEnv.authenticatedContext("doctor-uid", { admin: true, email_verified: true }).firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "patients/patient-a/auditLogs/event-1"), {
      action: "patient.created"
    });
  });

  await assertFails(getDoc(doc(patientDb, "patients/patient-a/auditLogs/event-1")));
  await assertFails(getDoc(doc(patientDb, "patients/patient-a/doctorNotes/note-1")));
  await assertSucceeds(getDoc(doc(adminDb, "patients/patient-a/auditLogs/event-1")));
  await assertSucceeds(getDoc(doc(adminDb, "patients/patient-a/doctorNotes/note-1")));
  await assertFails(setDoc(doc(adminDb, "patients/patient-a/auditLogs/forged"), {
    action: "forged"
  }));
});

test("unverified administrator claim cannot read or manage clinical records", async () => {
  const db = testEnv.authenticatedContext("unverified-doctor", {
    admin: true,
    email_verified: false
  }).firestore();

  await assertFails(getDoc(doc(db, "patients/patient-a")));
  await assertFails(getDocs(collection(db, "patients")));
  await assertFails(
    setDoc(doc(db, "patients/patient-a/measurements/forged"), {
      weightKg: 1
    })
  );
});

test("patient mapping alone is insufficient without reciprocal linked UID", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/patient-spoof"), { patientId: "patient-a" });
  });

  const db = testEnv.authenticatedContext("patient-spoof", {
    email_verified: true
  }).firestore();

  await assertFails(getDoc(doc(db, "patients/patient-a")));
  await assertFails(getDoc(doc(db, "patients/patient-a/prescriptions/rx-1")));
});


test("Preview patient can read only their own isolated record and mapping", async () => {
  const db = testEnv.authenticatedContext("preview-patient-a", { email_verified: true }).firestore();
  const ownPatient = "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a";
  const otherPatient = "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-b";

  await assertSucceeds(getDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/users/preview-patient-a")));
  await assertSucceeds(getDoc(doc(db, ownPatient)));
  await assertFails(getDoc(doc(db, otherPatient)));
  await assertFails(getDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/users/preview-patient-b")));
  await assertFails(getDocs(collection(db, "previewEnvironments/mejoras-seguridad-origen/patients")));
  await assertFails(getDoc(doc(db, "previewEnvironments/otro-entorno/patients/preview-patient-a")));
});

test("Preview patient can append a valid daily log only to their own record", async () => {
  const db = testEnv.authenticatedContext("preview-patient-a").firestore();
  const dateKey = "2026-11-18";
  await assertSucceeds(setDoc(doc(db, `previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/dailyLogs/${dateKey}`), {
    dateKey, proteinGrams: 85, waterMl: 2000,
    electrolytesTaken: false, createdAt: serverTimestamp()
  }));
  await assertFails(setDoc(doc(db, `previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-b/dailyLogs/${dateKey}`), {
    dateKey, proteinGrams: 85, waterMl: 2000,
    electrolytesTaken: false, createdAt: serverTimestamp()
  }));
});

test("Preview patient cannot access internal notes or alter clinical records", async () => {
  const db = testEnv.authenticatedContext("preview-patient-a").firestore();
  await assertFails(getDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/doctorNotes/private-1")));
  await assertFails(setDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/measurements/forged"), { weightKg: 1 }));
});

test("verified administrator can manage Preview records but unverified administrator cannot", async () => {
  const adminDb = testEnv.authenticatedContext("preview-doctor", { admin: true, email_verified: true }).firestore();
  const unverifiedDb = testEnv.authenticatedContext("preview-unverified", { admin: true, email_verified: false }).firestore();
  await assertSucceeds(getDocs(collection(adminDb, "previewEnvironments/mejoras-seguridad-origen/patients")));
  await assertSucceeds(setDoc(doc(adminDb, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/measurements/admin-metric"), { weightKg: 80 }));
  await assertFails(getDoc(doc(unverifiedDb, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a")));
  await assertFails(setDoc(doc(unverifiedDb, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/measurements/forged"), { weightKg: 1 }));
});


test("suspended root patient access is denied by Firestore rules", async () => {
  const patientDb = testEnv.authenticatedContext("patient-a", { email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext("doctor-uid", { admin: true, email_verified: true }).firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await updateDoc(doc(db, "patients/patient-a"), { portalAccessStatus: "suspended" });
  });

  await assertFails(getDoc(doc(patientDb, "patients/patient-a")));
  await assertFails(getDoc(doc(patientDb, "patients/patient-a/measurements/metric-1")));
  await assertSucceeds(getDoc(doc(adminDb, "patients/patient-a")));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await updateDoc(doc(db, "patients/patient-a"), { portalAccessStatus: "enabled" });
    await updateDoc(doc(db, "users/patient-a"), { portalAccessStatus: "suspended" });
  });

  await assertFails(getDoc(doc(patientDb, "patients/patient-a")));
});

test("suspended Preview patient access is denied by Firestore rules", async () => {
  const patientDb = testEnv.authenticatedContext("preview-patient-a", { email_verified: true }).firestore();
  const ownPatient = "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a";

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await updateDoc(doc(db, ownPatient), { portalAccessStatus: "suspended" });
  });

  await assertFails(getDoc(doc(patientDb, ownPatient)));
  await assertFails(getDoc(doc(patientDb, ownPatient + "/measurements/metric-1")));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await updateDoc(doc(db, ownPatient), { portalAccessStatus: "enabled" });
    await updateDoc(doc(db, "previewEnvironments/mejoras-seguridad-origen/users/preview-patient-a"), {
      portalAccessStatus: "suspended"
    });
  });

  await assertFails(getDoc(doc(patientDb, ownPatient)));
});


test("daily log rejects unsupported V1 fields until the schema and rules are migrated", async () => {
  const db = testEnv.authenticatedContext("patient-a", { email_verified: true }).firestore();

  await assertFails(addDoc(collection(db, "patients/patient-a/dailyLogs"), {
    dateKey: "2026-11-19",
    proteinGrams: 90,
    waterMl: 2100,
    electrolytesTaken: false,
    meals: { breakfast: true, lunch: false, dinner: false, snacks: 0 },
    activityMinutes: 30,
    schemaVersion: 1,
    createdAt: serverTimestamp()
  }));
});

test("daily log rejects malformed dates and values outside the current contract", async () => {
  const db = testEnv.authenticatedContext("patient-a", { email_verified: true }).firestore();
  const base = {
    dateKey: "2026-11-19",
    proteinGrams: 90,
    waterMl: 2100,
    electrolytesTaken: false,
    createdAt: serverTimestamp()
  };

  await assertFails(addDoc(collection(db, "patients/patient-a/dailyLogs"), {
    ...base, dateKey: "19-11-2026"
  }));
  await assertFails(addDoc(collection(db, "patients/patient-a/dailyLogs"), {
    ...base, proteinGrams: 301
  }));
  await assertFails(addDoc(collection(db, "patients/patient-a/dailyLogs"), {
    ...base, waterMl: 7001
  }));
});

test("daily log cannot be submitted twice under the same deterministic date ID", async () => {
  const db = testEnv.authenticatedContext("patient-a", { email_verified: true }).firestore();
  const logRef = doc(db, "patients/patient-a/dailyLogs/2026-11-20");
  const payload = {
    dateKey: "2026-11-20",
    proteinGrams: 90,
    waterMl: 2100,
    electrolytesTaken: false,
    createdAt: serverTimestamp()
  };

  await assertSucceeds(setDoc(logRef, payload));
  await assertFails(setDoc(logRef, {
    ...payload,
    proteinGrams: 110,
    createdAt: serverTimestamp()
  }));
});

test("root patient cannot append a daily log to another patient's record", async () => {
  const db = testEnv.authenticatedContext("patient-a", { email_verified: true }).firestore();

  await assertFails(addDoc(collection(db, "patients/patient-b/dailyLogs"), {
    dateKey: "2026-11-19",
    proteinGrams: 90,
    waterMl: 2100,
    electrolytesTaken: false,
    createdAt: serverTimestamp()
  }));
});

test("suspended Preview patient cannot append a daily log", async () => {
  const db = testEnv.authenticatedContext("preview-patient-a", { email_verified: true }).firestore();
  const patientPath = "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a";

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), patientPath), {
      portalAccessStatus: "suspended"
    });
  });

  await assertFails(addDoc(collection(db, patientPath + "/dailyLogs"), {
    dateKey: "2026-11-19",
    proteinGrams: 90,
    waterMl: 2100,
    electrolytesTaken: false,
    createdAt: serverTimestamp()
  }));
});

test("daily log document IDs must match the submitted date in root and Preview", async () => {
  const payload = {
    dateKey: "2026-11-21",
    proteinGrams: 90,
    waterMl: 2100,
    electrolytesTaken: false,
    createdAt: serverTimestamp()
  };
  const rootDb = testEnv.authenticatedContext("patient-a", { email_verified: true }).firestore();
  const previewDb = testEnv.authenticatedContext("preview-patient-a", { email_verified: true }).firestore();

  await assertFails(setDoc(doc(rootDb, "patients/patient-a/dailyLogs/not-the-date"), payload));
  await assertFails(setDoc(
    doc(previewDb, "previewEnvironments/mejoras-seguridad-origen/patients/preview-patient-a/dailyLogs/not-the-date"),
    payload
  ));
});
