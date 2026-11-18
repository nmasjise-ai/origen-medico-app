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

  await assertSucceeds(
    addDoc(collection(db, "patients/patient-a/dailyLogs"), {
      dateKey: "2026-11-17",
      proteinGrams: 90,
      waterMl: 2100,
      electrolytesTaken: false,
      createdAt: serverTimestamp()
    })
  );
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
  const adminDb = testEnv.authenticatedContext("doctor-uid", { admin: true }).firestore();

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
