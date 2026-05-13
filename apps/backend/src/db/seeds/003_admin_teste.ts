import type { Knex } from "knex";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Seed: dados de teste para o painel Admin
 *
 * Cria um restaurante para cada status possível, cada tipo de usuário
 * (admin e operador, ativo e inativo) e variações de onboarding para
 * testar o progresso e o alerta de "TRAVADO".
 *
 * Pré-requisito: seed 001_superadmin.ts já ter rodado.
 *
 * Credenciais criadas (senha padrão: cotaweb123):
 *
 *   RESTAURANTE               STATUS       ONBOARDING
 *   Pizzaria Bella Napoli     ativo        completo (forn + itens + cotação)
 *   Churrascaria Gaúcha       degustacao   TRAVADO  (nenhum cadastro)
 *   Sushi Nagoya              degustacao   parcial  (forn + itens, sem cotação)
 *   Bistrô do Chef            suspenso     parcial  (só fornecedores)
 *   Hamburgueria Urban        ativo        completo (volume alto)
 *   Cantina Italiana          cancelado    parcial
 *   Açaí Paraíso              degustacao   TRAVADO  (novo, zerado)
 *
 *   USUÁRIOS DE ACESSO DIRETO
 *   admin-bella@teste.com     admin    ativo   → Pizzaria Bella Napoli
 *   op-bella@teste.com        operador ativo   → Pizzaria Bella Napoli
 *   admin-gaucha@teste.com    admin    ativo   → Churrascaria Gaúcha
 *   op-gaucha@teste.com       operador inativo → Churrascaria Gaúcha (teste de desativado)
 *   admin-sushi@teste.com     admin    ativo   → Sushi Nagoya
 *   admin-bistro@teste.com    admin    inativo → Bistrô do Chef     (teste de desativado)
 *   admin-urban@teste.com     admin    ativo   → Hamburgueria Urban
 *   op-urban@teste.com        operador ativo   → Hamburgueria Urban
 *   admin-acai@teste.com      admin    ativo   → Açaí Paraíso
 */
export async function seed(knex: Knex): Promise<void> {

  // Remove apenas os dados deste seed para poder re-rodar sem conflito.
  const emailsTeste = [
    "admin-bella@teste.com",
    "op-bella@teste.com",
    "admin-gaucha@teste.com",
    "op-gaucha@teste.com",
    "admin-sushi@teste.com",
    "admin-bistro@teste.com",
    "admin-urban@teste.com",
    "op-urban@teste.com",
    "admin-acai@teste.com",
  ];

  const cnpjsTeste = [
    "11.111.111/0001-01",
    "22.222.222/0001-02",
    "33.333.333/0001-03",
    "44.444.444/0001-04",
    "55.555.555/0001-05",
    "66.666.666/0001-06",
    "77.777.777/0001-07",
  ];

  await knex("usuarios").whereIn("email", emailsTeste).del();

  const restantesIds = await knex("restaurantes")
    .whereIn("cnpj", cnpjsTeste)
    .pluck("id");

  if (restantesIds.length) {
    await knex("cotacoes").whereIn("restaurante_id", restantesIds).del();
    await knex("itens").whereIn("restaurante_id", restantesIds).del();
    await knex("fornecedores").whereIn("restaurante_id", restantesIds).del();
    await knex("departamentos").whereIn("restaurante_id", restantesIds).del();
    await knex("restaurantes").whereIn("id", restantesIds).del();
  }

  const senhaHash = await bcrypt.hash("cotaweb123", 12);

  const [bella] = await knex("restaurantes")
    .insert({
      nome: "Pizzaria Bella Napoli",
      telefone: "11988880001",
      email: "contato@bellanapolidemo.com",
      cnpj: "11.111.111/0001-01",
      responsavel: "Carlos Mendes",
      status: "ativo",
      degustacao_inicio: new Date("2025-11-15").toISOString(),
    })
    .returning("id");

  const [depBellaM, depBellaB] = await knex("departamentos")
    .insert([
      { restaurante_id: bella.id, nome: "MERCEARIA", descricao: "Secos e molhados" },
      { restaurante_id: bella.id, nome: "BEBIDAS", descricao: "Refrigerantes e sucos" },
    ])
    .returning("id");

  const [fornBella1, fornBella2] = await knex("fornecedores")
    .insert([
      { restaurante_id: bella.id, nome: "Distribuidora Sul", telefone: "11988880010", email: "vendas@sul.com", cnpj: "10.000.001/0001-00", contato_nome: "Ricardo", ativo: true },
      { restaurante_id: bella.id, nome: "Bebidas Cia", telefone: "11988880011", email: "pedidos@bebidascia.com", cnpj: "10.000.002/0001-00", contato_nome: "Patrícia", ativo: true },
      { restaurante_id: bella.id, nome: "Laticínios Bom Gosto", telefone: "11988880012", email: null, cnpj: null, contato_nome: "Fernando", ativo: true },
      { restaurante_id: bella.id, nome: "Frigorífico Nobre", telefone: "11988880013", email: "nobre@frig.com", cnpj: "10.000.003/0001-00", contato_nome: "Juliana", ativo: true },
    ])
    .returning("id");

  const itensBella = await knex("itens")
    .insert([
      { restaurante_id: bella.id, departamento_id: depBellaM.id, produto: "Farinha de Trigo 5kg", unidade: "pct" },
      { restaurante_id: bella.id, departamento_id: depBellaM.id, produto: "Molho de Tomate 520g", unidade: "un" },
      { restaurante_id: bella.id, departamento_id: depBellaM.id, produto: "Azeite Extravirgem 500ml", unidade: "un" },
      { restaurante_id: bella.id, departamento_id: depBellaB.id, produto: "Coca-Cola 2L", unidade: "cx" },
      { restaurante_id: bella.id, departamento_id: depBellaB.id, produto: "Água Mineral 500ml", unidade: "cx" },
    ])
    .returning("id");

  const [cotBella] = await knex("cotacoes")
    .insert({
      restaurante_id: bella.id,
      titulo: "Cotação Semanal #01",
      status: "finalizada",
      enviada_em: new Date("2026-05-01").toISOString(),
      finalizada_em: new Date("2026-05-02").toISOString(),
    })
    .returning("id");

  const [cotItemBella1, cotItemBella2] = await knex("cotacao_itens")
    .insert([
      { cotacao_id: cotBella.id, item_id: itensBella[0].id, produto: "Farinha de Trigo 5kg", unidade: "pct", quantidade: 20 },
      { cotacao_id: cotBella.id, item_id: itensBella[3].id, produto: "Coca-Cola 2L", unidade: "cx", quantidade: 10 },
    ])
    .returning("id");

  const [cfBella1] = await knex("cotacao_fornecedores")
    .insert([
      { cotacao_id: cotBella.id, fornecedor_id: fornBella1.id, token_resposta: crypto.randomBytes(32).toString("hex"), status: "respondido", respondido_em: new Date().toISOString() },
      { cotacao_id: cotBella.id, fornecedor_id: fornBella2.id, token_resposta: crypto.randomBytes(32).toString("hex"), status: "respondido", respondido_em: new Date().toISOString() },
    ])
    .returning("id");

  await knex("usuarios").insert([
    { nome: "Carlos Mendes", email: "admin-bella@teste.com", senha_hash: senhaHash, restaurante_id: bella.id, cargo: "admin", ativo: true },
    { nome: "Lucia Mendes", email: "op-bella@teste.com", senha_hash: senhaHash, restaurante_id: bella.id, cargo: "operador", ativo: true },
  ]);

  const [gaucha] = await knex("restaurantes")
    .insert({
      nome: "Churrascaria Gaúcha",
      telefone: "11988880002",
      email: "contato@churrascgauchademo.com",
      cnpj: "22.222.222/0001-02",
      responsavel: "Joana Ferreira",
      status: "degustacao",
      degustacao_inicio: new Date("2026-04-01").toISOString(),
    })
    .returning("id");

  // Nenhum fornecedor, item ou cotação — onboarding 0/3 (TRAVADO)

  await knex("usuarios").insert([
    { nome: "Joana Ferreira", email: "admin-gaucha@teste.com", senha_hash: senhaHash, restaurante_id: gaucha.id, cargo: "admin", ativo: true },
    { nome: "Pedro Santos", email: "op-gaucha@teste.com", senha_hash: senhaHash, restaurante_id: gaucha.id, cargo: "operador", ativo: false },
  ]);

  const [sushi] = await knex("restaurantes")
    .insert({
      nome: "Sushi Nagoya",
      telefone: "11988880003",
      email: "contato@sushinagoya.com",
      cnpj: "33.333.333/0001-03",
      responsavel: "Taro Yamamoto",
      status: "degustacao",
      degustacao_inicio: new Date("2026-03-10").toISOString(),
    })
    .returning("id");

  const [depSushi] = await knex("departamentos")
    .insert({ restaurante_id: sushi.id, nome: "PESCADOS", descricao: "Peixes e frutos do mar" })
    .returning("id");

  await knex("fornecedores").insert([
    { restaurante_id: sushi.id, nome: "Peixaria Atlântico", telefone: "11988880030", email: "vendas@atlantico.com", cnpj: null, contato_nome: "Hiroshi", ativo: true },
    { restaurante_id: sushi.id, nome: "Distribuidora Oriente", telefone: "11988880031", email: "oriente@dist.com", cnpj: "10.000.004/0001-00", contato_nome: "Keiko", ativo: true },
  ]);

  await knex("itens").insert([
    { restaurante_id: sushi.id, departamento_id: depSushi.id, produto: "Salmão Fresco kg", unidade: "kg" },
    { restaurante_id: sushi.id, departamento_id: depSushi.id, produto: "Atum Bluefin kg", unidade: "kg" },
    { restaurante_id: sushi.id, departamento_id: depSushi.id, produto: "Arroz para Sushi 5kg", unidade: "pct" },
    { restaurante_id: sushi.id, departamento_id: depSushi.id, produto: "Alga Nori 100fls", unidade: "pct" },
    { restaurante_id: sushi.id, departamento_id: depSushi.id, produto: "Gergelim Branco 500g", unidade: "pct" },
    { restaurante_id: sushi.id, departamento_id: depSushi.id, produto: "Molho Shoyu 1L", unidade: "un" },
    { restaurante_id: sushi.id, departamento_id: depSushi.id, produto: "Gengibre em Conserva 1kg", unidade: "un" },
    { restaurante_id: sushi.id, departamento_id: depSushi.id, produto: "Wasabi em Pó 500g", unidade: "un" },
  ]);

  // Sem cotação ainda

  await knex("usuarios").insert([
    { nome: "Taro Yamamoto", email: "admin-sushi@teste.com", senha_hash: senhaHash, restaurante_id: sushi.id, cargo: "admin", ativo: true },
  ]);

  const [bistro] = await knex("restaurantes")
    .insert({
      nome: "Bistrô do Chef",
      telefone: "11988880004",
      email: "contato@bistrodemo.com",
      cnpj: "44.444.444/0001-04",
      responsavel: "Fernanda Lima",
      status: "suspenso",
      degustacao_inicio: new Date("2025-06-01").toISOString(),
    })
    .returning("id");

  const [depBistro] = await knex("departamentos")
    .insert({ restaurante_id: bistro.id, nome: "HORTIFRUTI", descricao: "Verduras e legumes" })
    .returning("id");

  await knex("fornecedores").insert([
    { restaurante_id: bistro.id, nome: "Horta Fresca LTDA", telefone: "11988880040", email: "horta@fresca.com", cnpj: null, contato_nome: "Marcos", ativo: true },
    { restaurante_id: bistro.id, nome: "Coop Orgânicos SP", telefone: "11988880041", email: null, cnpj: null, contato_nome: "Silvia", ativo: true },
    { restaurante_id: bistro.id, nome: "Frigorífico Prime", telefone: "11988880042", email: "prime@frig.com", cnpj: "10.000.005/0001-00", contato_nome: "Eduardo", ativo: false },
  ]);

  // Sem itens nem cotação

  await knex("usuarios").insert([
    { nome: "Fernanda Lima", email: "admin-bistro@teste.com", senha_hash: senhaHash, restaurante_id: bistro.id, cargo: "admin", ativo: false },
  ]);

  const [urban] = await knex("restaurantes")
    .insert({
      nome: "Hamburgueria Urban",
      telefone: "11988880005",
      email: "contato@urbandemo.com",
      cnpj: "55.555.555/0001-05",
      responsavel: "Bruno Costa",
      status: "ativo",
      degustacao_inicio: new Date("2025-09-20").toISOString(),
    })
    .returning("id");

  const [depUrbanM, depUrbanC, depUrbanB] = await knex("departamentos")
    .insert([
      { restaurante_id: urban.id, nome: "PROTEÍNAS", descricao: "Carnes e embutidos" },
      { restaurante_id: urban.id, nome: "CONGELADOS", descricao: "Batatas e pré-fritos" },
      { restaurante_id: urban.id, nome: "BEBIDAS", descricao: "Refrigerantes e cervejas" },
    ])
    .returning("id");

  const [fornUrban1, fornUrban2, fornUrban3] = await knex("fornecedores")
    .insert([
      { restaurante_id: urban.id, nome: "Frigorífico Boi Gordo", telefone: "11988880050", email: "boigordo@frig.com", cnpj: "10.000.006/0001-00", contato_nome: "Alexandre", ativo: true },
      { restaurante_id: urban.id, nome: "Frango & Cia", telefone: "11988880051", email: "vendas@frangocia.com", cnpj: "10.000.007/0001-00", contato_nome: "Camila", ativo: true },
      { restaurante_id: urban.id, nome: "Gelados Distribuidora", telefone: "11988880052", email: "gelados@dist.com", cnpj: "10.000.008/0001-00", contato_nome: "Diego", ativo: true },
      { restaurante_id: urban.id, nome: "Bebidas Express", telefone: "11988880053", email: "express@beb.com", cnpj: "10.000.009/0001-00", contato_nome: "Rebeca", ativo: true },
      { restaurante_id: urban.id, nome: "Laticínios Real", telefone: "11988880054", email: null, cnpj: null, contato_nome: "Guilherme", ativo: true },
    ])
    .returning("id");

  const itensUrban = await knex("itens")
    .insert([
      { restaurante_id: urban.id, departamento_id: depUrbanM.id, produto: "Blend Angus 180g", unidade: "kg" },
      { restaurante_id: urban.id, departamento_id: depUrbanM.id, produto: "Bacon Fatiado 1kg", unidade: "pct" },
      { restaurante_id: urban.id, departamento_id: depUrbanM.id, produto: "Cheddar Fatiado 1kg", unidade: "pct" },
      { restaurante_id: urban.id, departamento_id: depUrbanC.id, produto: "Batata Palito Congelada 2kg", unidade: "pct" },
      { restaurante_id: urban.id, departamento_id: depUrbanC.id, produto: "Onion Rings 1kg", unidade: "pct" },
      { restaurante_id: urban.id, departamento_id: depUrbanB.id, produto: "Coca-Cola Lata 350ml", unidade: "cx" },
      { restaurante_id: urban.id, departamento_id: depUrbanB.id, produto: "Heineken Long Neck 330ml", unidade: "cx" },
    ])
    .returning("id");

  // Cotação finalizada
  const [cotUrban1] = await knex("cotacoes")
    .insert({
      restaurante_id: urban.id,
      titulo: "Reposição Semanal #08",
      status: "finalizada",
      enviada_em: new Date("2026-04-28").toISOString(),
      finalizada_em: new Date("2026-04-29").toISOString(),
    })
    .returning("id");

  await knex("cotacao_itens").insert([
    { cotacao_id: cotUrban1.id, item_id: itensUrban[0].id, produto: "Blend Angus 180g", unidade: "kg", quantidade: 50 },
    { cotacao_id: cotUrban1.id, item_id: itensUrban[3].id, produto: "Batata Palito Congelada 2kg", unidade: "pct", quantidade: 30 },
    { cotacao_id: cotUrban1.id, item_id: itensUrban[5].id, produto: "Coca-Cola Lata 350ml", unidade: "cx", quantidade: 20 },
  ]);

  await knex("cotacao_fornecedores").insert([
    { cotacao_id: cotUrban1.id, fornecedor_id: fornUrban1.id, token_resposta: crypto.randomBytes(32).toString("hex"), status: "respondido", respondido_em: new Date().toISOString() },
    { cotacao_id: cotUrban1.id, fornecedor_id: fornUrban3.id, token_resposta: crypto.randomBytes(32).toString("hex"), status: "respondido", respondido_em: new Date().toISOString() },
  ]);

  // Cotação em rascunho (para testar estado rascunho)
  const [cotUrban2] = await knex("cotacoes")
    .insert({
      restaurante_id: urban.id,
      titulo: "Reposição Semanal #09",
      status: "rascunho",
    })
    .returning("id");

  await knex("cotacao_itens").insert([
    { cotacao_id: cotUrban2.id, item_id: itensUrban[1].id, produto: "Bacon Fatiado 1kg", unidade: "pct", quantidade: 10 },
    { cotacao_id: cotUrban2.id, item_id: itensUrban[2].id, produto: "Cheddar Fatiado 1kg", unidade: "pct", quantidade: 8 },
  ]);

  // Cotação enviada (para testar estado enviada/aguardando resposta)
  const [cotUrban3] = await knex("cotacoes")
    .insert({
      restaurante_id: urban.id,
      titulo: "Bebidas Quinzena",
      status: "enviada",
      enviada_em: new Date().toISOString(),
    })
    .returning("id");

  await knex("cotacao_itens").insert([
    { cotacao_id: cotUrban3.id, item_id: itensUrban[5].id, produto: "Coca-Cola Lata 350ml", unidade: "cx", quantidade: 40 },
    { cotacao_id: cotUrban3.id, item_id: itensUrban[6].id, produto: "Heineken Long Neck 330ml", unidade: "cx", quantidade: 20 },
  ]);

  await knex("cotacao_fornecedores").insert([
    { cotacao_id: cotUrban3.id, fornecedor_id: fornUrban2.id, token_resposta: crypto.randomBytes(32).toString("hex"), status: "aguardando" },
    { cotacao_id: cotUrban3.id, fornecedor_id: fornUrban3.id, token_resposta: crypto.randomBytes(32).toString("hex"), status: "aguardando" },
  ]);

  await knex("usuarios").insert([
    { nome: "Bruno Costa", email: "admin-urban@teste.com", senha_hash: senhaHash, restaurante_id: urban.id, cargo: "admin", ativo: true },
    { nome: "Rafael Moura", email: "op-urban@teste.com", senha_hash: senhaHash, restaurante_id: urban.id, cargo: "operador", ativo: true },
  ]);

  const [cantina] = await knex("restaurantes")
    .insert({
      nome: "Cantina Italiana",
      telefone: "11988880006",
      email: "contato@cantina.com",
      cnpj: "66.666.666/0001-06",
      responsavel: "Marco Rossi",
      status: "cancelado",
      degustacao_inicio: new Date("2024-12-01").toISOString(),
    })
    .returning("id");

  const [depCantina] = await knex("departamentos")
    .insert({ restaurante_id: cantina.id, nome: "MASSAS", descricao: "Massas e molhos" })
    .returning("id");

  await knex("fornecedores").insert([
    { restaurante_id: cantina.id, nome: "Massas Toscana", telefone: "11988880060", email: "toscana@massas.com", cnpj: null, contato_nome: "Gianni", ativo: true },
  ]);

  await knex("itens").insert([
    { restaurante_id: cantina.id, departamento_id: depCantina.id, produto: "Spaghetti 500g", unidade: "pct" },
    { restaurante_id: cantina.id, departamento_id: depCantina.id, produto: "Penne 500g", unidade: "pct" },
    { restaurante_id: cantina.id, departamento_id: depCantina.id, produto: "Molho Bolonhesa 300g", unidade: "un" },
  ]);

  // Sem cotação

  const [acai] = await knex("restaurantes")
    .insert({
      nome: "Açaí Paraíso Teste",
      telefone: "11988880007",
      email: null,
      cnpj: "77.777.777/0001-07",
      responsavel: "Ana Souza",
      status: "degustacao",
      degustacao_inicio: new Date("2026-05-02").toISOString(),
    })
    .returning("id");

  // Nenhum fornecedor, item ou cotação — onboarding 0/3 (TRAVADO)

  await knex("usuarios").insert([
    { nome: "Ana Souza", email: "admin-acai@teste.com", senha_hash: senhaHash, restaurante_id: acai.id, cargo: "admin", ativo: true },
  ]);

  console.log("✅ Seed de teste admin criado com sucesso!");
  console.log("");
  console.log("   Senha de todos os usuários: cotaweb123");
  console.log("");
  console.log("   RESTAURANTES:");
  console.log("   ativo      → Pizzaria Bella Napoli   (onboarding completo)");
  console.log("   degustacao → Churrascaria Gaúcha      (TRAVADO — onboarding 0/3)");
  console.log("   degustacao → Sushi Nagoya             (parcial — forn + itens)");
  console.log("   suspenso   → Bistrô do Chef           (parcial — só fornecedores)");
  console.log("   ativo      → Hamburgueria Urban       (completo + cotações em aberto)");
  console.log("   cancelado  → Cantina Italiana         (parcial — forn + itens)");
  console.log("   degustacao → Açaí Paraíso Teste       (TRAVADO — zerado)");
  console.log("");
  console.log("   USUÁRIOS:");
  console.log("   admin-bella@teste.com   admin    ativo");
  console.log("   op-bella@teste.com      operador ativo");
  console.log("   admin-gaucha@teste.com  admin    ativo");
  console.log("   op-gaucha@teste.com     operador INATIVO");
  console.log("   admin-sushi@teste.com   admin    ativo");
  console.log("   admin-bistro@teste.com  admin    INATIVO");
  console.log("   admin-urban@teste.com   admin    ativo");
  console.log("   op-urban@teste.com      operador ativo");
  console.log("   admin-acai@teste.com    admin    ativo");
}