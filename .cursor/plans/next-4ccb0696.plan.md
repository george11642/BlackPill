<!-- 4ccb0696-0c50-44e3-bb87-fe84c28bc5c1 a856e5ce-a325-4fe8-8fc1-29da9b69b700 -->
# Fix Path Alias Build Error

1. Update `web/tsconfig.json` so `compilerOptions` defines `baseUrl` and a `paths` entry mapping `@/*` to `src/*`, enabling TypeScript to resolve imports like `@/components/SEO`.
2. In the same file, keep existing options intact while formatting the new fields consistently (JSON commas, indentation) to avoid lint issues.
3. After the edit, run `npm run build` inside `web/` to confirm the Next.js build succeeds without module resolution errors.

### To-dos

- [ ] Add baseUrl and @ path alias to web/tsconfig.json
- [ ] Run npm run build in web/ to ensure the path alias resolves