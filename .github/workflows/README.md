# CI/CD Workflows

This directory contains GitHub Actions workflows for automated testing, building, and deployment.

## Workflows

### ci.yml - Main CI/CD Pipeline

**Triggers:**
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### 1. Test & Coverage
- Runs on: Ubuntu Latest with Node.js 20.x
- Steps:
  - Install dependencies with `npm ci`
  - Generate Prisma client
  - Run ESLint (non-blocking)
  - Run unit tests with coverage
  - Upload coverage to Codecov
  - Check coverage thresholds (70% target)
  - Archive test results as artifacts (30-day retention)
  - Comment coverage report on PRs

**Current Test Metrics:**
- ✅ 86/86 tests passing (100% pass rate)
- Coverage: 22.79% statements (target: 70%)
- 7 test suites, all passing

#### 2. Build Check
- Runs after: Test job succeeds
- Steps:
  - Install dependencies
  - Generate Prisma client
  - Build backend application
  - Type-check mobile app (Expo)

#### 3. Security Audit
- Runs in parallel with other jobs
- Steps:
  - Run `npm audit` for high-severity vulnerabilities
  - Run Snyk security scan (requires SNYK_TOKEN secret)

#### 4. Deploy to Staging
- Triggers: Push to `develop` branch
- Requires: Test and build jobs pass
- Deploys to Railway staging environment

#### 5. Deploy to Production
- Triggers: Push to `main` branch
- Requires: Test, build, and security jobs pass
- Deploys to Railway production environment
- Creates GitHub deployment notification

## Required Secrets

Configure these in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret | Description | Required For |
|--------|-------------|--------------|
| `CODECOV_TOKEN` | Codecov API token for coverage uploads | Test job (optional) |
| `SNYK_TOKEN` | Snyk API token for security scanning | Security job (optional) |
| `RAILWAY_TOKEN` | Railway CLI token for deployments | Deploy jobs |

## Status Badges

Add these to your README.md:

```markdown
![CI Status](https://github.com/YOUR_ORG/genki-tcg/workflows/CI%2FCD%20Pipeline/badge.svg)
![Coverage](https://codecov.io/gh/YOUR_ORG/genki-tcg/branch/main/graph/badge.svg)
![Tests](https://img.shields.io/badge/tests-86%20passed-success)
```

## Local Testing

Test the workflow locally using [act](https://github.com/nektos/act):

```bash
# Install act
npm install -g @nektos/act

# Run the test job locally
act -j test

# Run all jobs
act push
```

## Coverage Thresholds

Current Jest configuration enforces these thresholds (apps/backend/jest.config.js):

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

⚠️ **Note**: Coverage thresholds are currently set to `continue-on-error: true` during Phase 2 testing expansion. Once we reach 70% coverage, this will be changed to fail the build on threshold violations.

## Artifacts

Test results and coverage reports are archived for 30 days:
- `apps/backend/coverage/` - HTML coverage reports
- `apps/backend/test-results/` - JUnit test results

Access artifacts from the Actions tab → Select workflow run → Artifacts section

## Troubleshooting

### Test Job Fails
1. Check test output in Actions logs
2. Run tests locally: `cd apps/backend && npm test`
3. Verify Prisma client generation: `npx prisma generate`

### Build Job Fails
1. Check for TypeScript errors: `npm run build`
2. Verify all dependencies installed: `npm ci`
3. Check for missing environment variables

### Deploy Job Fails
1. Verify Railway token is valid
2. Check Railway project configuration
3. Ensure environment is properly configured in Railway dashboard

## Phase 2 Testing Status

**Current Progress:**
- ✅ Test infrastructure complete
- ✅ 100% test pass rate achieved
- ✅ CI/CD pipeline operational
- 🟡 Coverage expansion in progress (22.79% → 70% goal)

**Next Steps:**
1. Expand auth.service test coverage
2. Create E2E test suite
3. Add controller tests
4. Reach 70% coverage threshold
5. Enable strict coverage enforcement

## Contributing

When adding new tests:
1. Follow the gold standard pattern (see PHASE_2_TESTING_PROGRESS.md)
2. Always test IDOR protection first
3. Include happy path and edge cases
4. Ensure all tests pass locally before pushing
5. Verify coverage doesn't decrease

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Coverage Configuration](https://jestjs.io/docs/configuration#coveragethreshold-object)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)
- [Codecov Documentation](https://docs.codecov.com/docs)
