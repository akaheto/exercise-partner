import postgres from "postgres";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);

  const stats = await client<{ instructions_status: string; count: number }[]>`
    select instructions_status, count(*) as count
    from curation_status
    group by instructions_status
    order by instructions_status
  `;

  console.log("=== Curation Progress ===");
  let approved = 0;
  let total = 0;

  for (const row of stats) {
    const count = Number(row.count);
    total += count;
    if (row.instructions_status === "approved") approved = count;
    console.log(`  ${row.instructions_status}: ${count}`);
  }

  const percent = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";
  console.log(`\nTotal: ${approved}/${total} (${percent}%)`);
  console.log(
    `Estimated completion: ${Math.ceil((total - approved) / 10 / 60)} more minutes`
  );

  await client.end();
}

main().catch(console.error).finally(() => process.exit(0));
