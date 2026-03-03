-- CreateIndex
CREATE INDEX "ServiceOrder_company_id_idx" ON "ServiceOrder"("company_id");

-- CreateIndex
CREATE INDEX "ServiceOrder_note_issued_due_date_idx" ON "ServiceOrder"("note_issued", "due_date");
