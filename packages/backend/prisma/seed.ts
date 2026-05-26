import { loadEnvFile } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaClient } from "./generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnvFile();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─── Limpa dados anteriores do seed (ordem importa por FK) ───────────────
  await prisma.serviceOrder.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({ where: { email: "guisix16@gmail.com" } });

  // ─── Usuário ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("senha123", 10);

  const user = await prisma.user.create({
    data: {
      name: "Guilherme Silva",
      email: "guisix16@gmail.com",
      password_hash: passwordHash,
    },
  });

  console.log(`✅ Usuário criado: ${user.email} (senha: senha123)`);

  // ─── Empresas ─────────────────────────────────────────────────────────────
  const [acme, studio, consultoria] = await Promise.all([
    prisma.company.create({
      data: {
        name: "Acme Tecnologia Ltda",
        cnpj: "11222333000181",
        user_id: user.id,
      },
    }),
    prisma.company.create({
      data: {
        name: "Studio Criativo ME",
        cnpj: "22333444000116",
        user_id: user.id,
      },
    }),
    prisma.company.create({
      data: {
        name: "Consultoria Legal SA",
        cnpj: "33444555000156",
        user_id: user.id,
      },
    }),
  ]);

  console.log(`✅ 3 empresas criadas`);

  // ─── Ordens de serviço ────────────────────────────────────────────────────
  // Legenda de colunas: [empresa] serviço | vencimento | status | nota emitida | notificado
  //
  // As marcadas com 📧 vão disparar lembrete (note_issued=false, notified=false, due_date ≤ hoje+3d)

  await prisma.serviceOrder.createMany({
    data: [
      // ── Acme Tecnologia ──────────────────────────────────────────────────
      {
        // 📧 vence em 1 dia → dispara email
        company_id: acme.id,
        service_name: "Desenvolvimento de Software",
        amount: 1500000, // R$ 15.000,00
        due_date: daysFromNow(1),
        service_status: "IN_PROGRESS",
        note_issued: false,
        notified: false,
      },
      {
        // 📧 vence em 2 dias → dispara email
        company_id: acme.id,
        service_name: "Consultoria em TI",
        amount: 750000, // R$ 7.500,00
        due_date: daysFromNow(2),
        service_status: "PENDING",
        note_issued: false,
        notified: false,
      },
      {
        // Vence em 10 dias → ainda não dispara
        company_id: acme.id,
        service_name: "Manutenção de Sistemas",
        amount: 300000, // R$ 3.000,00
        due_date: daysFromNow(10),
        service_status: "PENDING",
        note_issued: false,
        notified: false,
      },
      {
        // Nota já emitida → não dispara
        company_id: acme.id,
        service_name: "Suporte Técnico Mensal",
        amount: 120000, // R$ 1.200,00
        due_date: daysFromNow(5),
        service_status: "COMPLETED",
        note_issued: true,
        notified: false,
      },
      {
        // Vencimento longo → não dispara
        company_id: acme.id,
        service_name: "Implantação de ERP",
        amount: 8000000, // R$ 80.000,00
        due_date: daysFromNow(45),
        service_status: "PENDING",
        note_issued: false,
        notified: false,
      },

      // ── Studio Criativo ──────────────────────────────────────────────────
      {
        // 📧 venceu ontem (atrasado) → dispara email
        company_id: studio.id,
        service_name: "Design de Identidade Visual",
        amount: 450000, // R$ 4.500,00
        due_date: daysFromNow(-1),
        service_status: "PENDING",
        note_issued: false,
        notified: false,
      },
      {
        // Já notificado → não dispara de novo
        company_id: studio.id,
        service_name: "Criação de Site Institucional",
        amount: 900000, // R$ 9.000,00
        due_date: daysFromNow(3),
        service_status: "IN_PROGRESS",
        note_issued: false,
        notified: true,
        notification_count: 1,
        last_notification_at: new Date(),
      },
      {
        // Vence em 20 dias → não dispara agora
        company_id: studio.id,
        service_name: "Edição de Vídeo Institucional",
        amount: 600000, // R$ 6.000,00
        due_date: daysFromNow(20),
        service_status: "PENDING",
        note_issued: false,
        notified: false,
      },
      {
        // Cancelada → não dispara
        company_id: studio.id,
        service_name: "Animação de Logo",
        amount: 350000, // R$ 3.500,00
        due_date: daysFromNow(7),
        service_status: "CANCELLED",
        note_issued: false,
        notified: false,
      },

      // ── Consultoria Legal ────────────────────────────────────────────────
      {
        // 📧 vence amanhã → dispara email
        company_id: consultoria.id,
        service_name: "Assessoria Tributária",
        amount: 2000000, // R$ 20.000,00
        due_date: daysFromNow(1),
        service_status: "IN_PROGRESS",
        note_issued: false,
        notified: false,
      },
      {
        // 📧 venceu há 2 dias (bem atrasado) → dispara email
        company_id: consultoria.id,
        service_name: "Revisão Contratual",
        amount: 550000, // R$ 5.500,00
        due_date: daysFromNow(-2),
        service_status: "PENDING",
        note_issued: false,
        notified: false,
      },
      {
        // Vence em 60 dias → não dispara
        company_id: consultoria.id,
        service_name: "Planejamento Fiscal Anual",
        amount: 3500000, // R$ 35.000,00
        due_date: daysFromNow(60),
        service_status: "PENDING",
        note_issued: false,
        notified: false,
      },
      {
        // Nota emitida e concluída
        company_id: consultoria.id,
        service_name: "Relatório de Conformidade",
        amount: 1200000, // R$ 12.000,00
        due_date: daysFromNow(-10),
        service_status: "COMPLETED",
        note_issued: true,
        notified: true,
        notification_count: 2,
      },
    ],
  });

  console.log(`✅ 13 ordens de serviço criadas`);
  console.log("");
  console.log("📧 Ordens que vão disparar lembrete (due ≤ hoje+3d, sem nota, sem notificação):");
  console.log("   • Desenvolvimento de Software  — Acme Tecnologia  — vence em 1d  — R$ 15.000");
  console.log("   • Consultoria em TI            — Acme Tecnologia  — vence em 2d  — R$  7.500");
  console.log("   • Design de Identidade Visual  — Studio Criativo  — venceu ontem — R$  4.500");
  console.log("   • Assessoria Tributária        — Consultoria Legal — vence em 1d — R$ 20.000");
  console.log("   • Revisão Contratual           — Consultoria Legal — venceu há 2d — R$  5.500");
  console.log("");
  console.log("🔑 Login: guisix16@gmail.com / senha123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
