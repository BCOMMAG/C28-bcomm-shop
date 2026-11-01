const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI5NTM0MDIxNWVkZTU2MmU3ZWI3YjVlNmU0ODc3MzY4YmZjNTQwZTk4NzE4OWY1YmE3Yjg2YzliMTQ1NTY2ZmEzMGVlNDcyOGU2ZGIyMTEyZSIsImlhdCI6MTc5MzU2NzQ2Ni4yODIwMywibmJmIjoxNzkzNTY3NDY2LjI4MjAzMiwiZXhwIjoxODI1MTAzNDY2LjI3MjA4NCwic3ViIjoiYTMxZmI3OTItMWE2Mi00ZTNkLTlkMDctNDYxMDE5YjM5N2EzIiwic2NvcGVzIjpbImNhcnQtcmVhZCIsImNhcnQtd3JpdGUiLCJjb21wYW5pZXMtcmVhZCIsImNvbXBhbmllcy13cml0ZSIsImNvdXBvbnMtcmVhZCIsImNvdXBvbnMtd3JpdGUiLCJub3RpZmljYXRpb25zLXJlYWQiLCJvcmRlcnMtcmVhZCIsInByb2R1Y3RzLXJlYWQiLCJwcm9kdWN0cy1kZXN0cm95IiwicHJvZHVjdHMtd3JpdGUiLCJwdXJjaGFzZXMtcmVhZCIsInNoaXBwaW5nLWNhbGN1bGF0ZSIsInNoaXBwaW5nLWNhbmNlbCIsInNoaXBwaW5nLWNoZWNrb3V0Iiwic2hpcHBpbmctY29tcGFuaWVzIiwic2hpcHBpbmctZ2VuZXJhdGUiLCJzaGlwcGluZy1wcmV2aWV3Iiwic2hpcHBpbmctcHJpbnQiLCJzaGlwcGluZy1zaGFyZSIsInNoaXBwaW5nLXRyYWNraW5nIiwiZWNvbW1lcmNlLXNoaXBwaW5nIiwidHJhbnNhY3Rpb25zLXJlYWQiLCJ1c2Vycy1yZWFkIiwidXNlcnMtd3JpdGUiLCJ3ZWJob29rcy1yZWFkIiwid2ViaG9va3Mtd3JpdGUiLCJ3ZWJob29rcy1kZWxldGUiLCJ0ZGVhbGVyLXdlYmhvb2siLCJtY3A6dXNlIl19.HafmTl0rZqNmis2sl6mBJ4otIaRodVEzDlhjM5bqAcGepJfKZUQo83FnjXUMoEfZiz5hAaZTEzCn40sqV_W7T_bpKMJW-XS8rdohCWqcTNi7U9es3c6KSNNGasw7oD3B1nRPU768DxfMKHcfxeqVq5wK-0XhpwYr-PjHKwxtwBczWjxf6wzepeKDHRY-yS_Ez0XycIvV_AqsuPG93Tn1Gu61vQLXles-lahxnoIdfAN7oHpPKLrUMdUQ2ChjQzOwkp7Oypn7x881Q3zbMIAGVgpAIM7nqpb4I812YhmRMdMG-rA_MrVfu4bHLi11aKULuBpAkx8nO7mnCf0sVLcgerdBOYgCz9tzJPT0ICV3au88eKKtk7ea9peJkj666ZlmD6ThS5gUrnaJZIMpFK1mLu3rShxFVQQxIJxPrrB5aOlOPlI3aJT9wJ2EeHYrAdwBWEoUUVigQLaBpzPlVx-Z-qmtzxcnRE61AXiEMeoP2r5AgbeLLcGnkfpFvXdttvePAeR4z8uoQotRGILSQZTg7a97-wczSbnsVe93Djkky1j1NjAU-avVCN9rXNoMgOTwDJVy6DJi1r_TdL-6NH2mwNhSJmXkbXRhfJkZZEGNYBj9iV6m9tzstUO0bVhj2J-uouRo6vekb9A7rS8sfxJdIMxfX4eP3QcEwoO3YiezWWw";

async function testCalculate() {
  console.log("🚀 Disparando cotação de teste no Sandbox do Melhor Envio...");
  try {
    const res = await fetch("https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "BCOMM Shop Sandbox (contato@agent-bcomm.space)"
      },
      body: JSON.stringify({
        from: { postal_code: "83005000" }, // Origem Curitiba / São José dos Pinhais
        to: { postal_code: "01001000" },   // Destino Centro São Paulo (Praça da Sé)
        package: {
          height: 8,
          width: 20,
          length: 25,
          weight: 0.3
        }
      })
    });

    console.log("Status HTTP:", res.status);
    const data = await res.json();
    console.log("📦 Resposta do Melhor Envio:");
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.error) {
          console.log(`❌ ${item.name} (${item.company?.name}): ${item.error}`);
        } else {
          console.log(`✅ ${item.name} (${item.company?.name}): R$ ${item.price} (Prazo: ${item.delivery_time} dias úteis) [Desconto: R$ ${item.discount}]`);
        }
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Erro na chamada:", err);
  }
}

testCalculate();

