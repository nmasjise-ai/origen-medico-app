import { FieldValue } from "firebase-admin/firestore";
import { isVerifiedAdministrator } from "../../_lib/admin-authorization.js";
import { getAdminFirestore, verifyRequestUser } from "../../_lib/firebase-admin.js";
import { getPreviewDataNamespace } from "../../_lib/staging-firestore.js";
import { normalizeNewFinanceProduct, normalizeFinanceProductUpdate } from "../../_lib/finance-validation.js";

const MAX_PRODUCTS = 300;

function productsCollection(db) {
  const [root, doc] = getPreviewDataNamespace().split("/");
  return db.collection(root).doc(doc).collection("financeProducts");
}

function asIso(value) {
  return value?.toDate ? value.toDate().toISOString() : null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST", "PATCH"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    if (!isVerifiedAdministrator(decoded)) {
      return res.status(403).json({ error: "Se requiere una cuenta administradora autorizada." });
    }
    const db = getAdminFirestore();
    const collection = productsCollection(db);

    if (req.method === "GET") {
      const snapshot = await collection.orderBy("updatedAt", "desc").limit(MAX_PRODUCTS).get();
      const products = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id, name: data.name, category: data.category, description: data.description || "",
          purchaseCostBs: data.purchaseCostBs, salePriceBs: data.salePriceBs,
          currentStock: data.currentStock || 0, minimumStock: data.minimumStock || 0,
          unit: data.unit || "unidad", supplier: data.supplier || "", lot: data.lot || "",
          expiryDate: data.expiryDate || "", active: data.active !== false,
          createdAt: asIso(data.createdAt), updatedAt: asIso(data.updatedAt)
        };
      });
      return res.status(200).json({ products, count: products.length, limit: MAX_PRODUCTS });
    }

    if (req.method === "POST") {
      const product = normalizeNewFinanceProduct(req.body);
      const ref = collection.doc();
      const batch = db.batch();
      batch.create(ref, {
        name: product.name, category: product.category, description: product.description,
        purchaseCostBs: product.purchaseCostBs, salePriceBs: product.salePriceBs,
        currentStock: product.initialStock, minimumStock: product.minimumStock,
        unit: product.unit, supplier: product.supplier, lot: product.lot,
        expiryDate: product.expiryDate, active: true, currency: "BOB",
        schemaVersion: 1, createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(), createdByUid: decoded.uid
      });
      const auditRef = ref.collection("auditLogs").doc();
      batch.create(auditRef, {
        action: "finance.product.created", actorUid: decoded.uid,
        occurredAt: FieldValue.serverTimestamp(), initialStock: product.initialStock,
        source: "admin_api"
      });
      await batch.commit();
      return res.status(201).json({
        product: { id: ref.id, ...product, currentStock: product.initialStock, active: true },
        message: "Producto creado en el inventario de pruebas."
      });
    }

    const productId = typeof req.body?.id === "string" ? req.body.id.trim() : "";
    if (!/^[A-Za-z0-9_-]{10,80}$/.test(productId)) {
      return res.status(400).json({ error: "Identificador de producto no válido." });
    }
    const patch = normalizeFinanceProductUpdate(req.body?.changes || {});
    const ref = collection.doc(productId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return res.status(404).json({ error: "No se encontró el producto." });
    const batch = db.batch();
    batch.update(ref, { ...patch, updatedAt: FieldValue.serverTimestamp(), updatedByUid: decoded.uid });
    const auditRef = ref.collection("auditLogs").doc();
    batch.create(auditRef, {
      action: "finance.product.updated", actorUid: decoded.uid,
      occurredAt: FieldValue.serverTimestamp(), changedFields: Object.keys(patch),
      source: "admin_api"
    });
    await batch.commit();
    return res.status(200).json({ ok: true, message: "Producto actualizado." });
  } catch (error) {
    const status = error.statusCode || (error.message?.includes("obligatorio") || error.message?.includes("válid") || error.message?.includes("permite") || error.message?.includes("caracteres") || error.message?.includes("entero") || error.message?.includes("importe") || error.message?.includes("No hay cambios") ? 400 : 500);
    console.error("Admin finance products API failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({
      error: status >= 500 ? "No se pudo completar la operación del inventario de pruebas." : error.message
    });
  }
}
