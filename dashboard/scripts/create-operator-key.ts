import { insertServiceApiKey } from '../lib/service-keys';

async function main(): Promise<void> {
  const name = process.argv[2]?.trim() || 'cli';
  const scopesArg = process.argv[3]?.trim();
  const scopes = scopesArg
    ? scopesArg
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['telemetry:read'];

  const { raw, prefix } = await insertServiceApiKey(name, scopes);
  console.log('Operator API key created (store this secret once; it is not shown again):');
  console.log('');
  console.log(raw);
  console.log('');
  console.log(`Name: ${name}`);
  console.log(`Prefix: ${prefix}`);
  console.log(`Scopes: ${scopes.join(', ')}`);
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
