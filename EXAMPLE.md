## Express 5 Example Usage

Here's a simple example of how to use `tibber-express-utils` with Express 5:

```typescript
import express from 'express';
import { jsonRouting, HttpResult } from 'tibber-express-utils';

const app = express();
const router = express.Router();

// Create a JSON router with tibber-express-utils
const jsonRouter = jsonRouting({
  expressRouter: router,
  logger: console, // Optional logger
});

// Define routes using the JSON API
jsonRouter.jsonGet('/users/:id', async (req) => {
  const userId = req.params.id;
  
  // Simulate async operation
  const user = await findUserById(userId);
  
  if (!user) {
    // Return 404 automatically when undefined
    return undefined;
  }
  
  // Return data with default 200 status
  return user;
});

jsonRouter.jsonPost('/users', async (req) => {
  const userData = req.body;
  
  // Create user with async operation
  const newUser = await createUser(userData);
  
  // Return with custom status code
  return new HttpResult(201, newUser);
});

// Mount the router
app.use('/api', jsonRouter);

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// Helper functions (examples)
async function findUserById(id: string) {
  // Your database logic here
  return { id, name: 'John Doe' };
}

async function createUser(userData: any) {
  // Your database logic here
  return { id: '123', ...userData };
}
```

### Key Benefits with Express 5:

1. **Better Async Error Handling**: Express 5 automatically catches rejected promises in async route handlers
2. **Improved Performance**: Better routing performance and memory usage
3. **Enhanced Type Safety**: Better TypeScript support with @types/express@5
4. **Future-Proof**: Uses the latest Express version with long-term support

### Migration Notes:

- No code changes required if upgrading from Express 4
- All existing `tibber-express-utils` APIs remain the same
- Express 5 is backward compatible with Express 4 patterns
