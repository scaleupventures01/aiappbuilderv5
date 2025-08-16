/**
 * Database Schema Validation Script
 * Description: Validates the users table schema against PRD requirements
 * PRD Reference: PRD-1.1.1.2-users-table.md
 * Created: 2025-08-14
 */

const { query } = require('./connection');

async function validateUsersTable() {
  console.log('🔍 Validating Users Table Schema...\n');
    
  const validationResults = {
    tableExists: false,
    columnsValid: false,
    constraintsValid: false,
    indexesValid: false,
    triggersValid: false,
    errors: []
  };

  try {
    // 1. Check if table exists
    console.log('1. Checking table existence...');
    const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            ) as exists
        `);
        
    if (tableCheck.rows[0].exists) {
      console.log('   ✅ Users table exists');
      validationResults.tableExists = true;
    } else {
      console.log('   ❌ Users table does not exist');
      validationResults.errors.push('Users table not found');
      return validationResults;
    }

    // 2. Validate columns
    console.log('\n2. Validating column structure...');
    const expectedColumns = [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'email', type: 'character varying', nullable: false },
      { name: 'username', type: 'character varying', nullable: false },
      { name: 'password_hash', type: 'character varying', nullable: false },
      { name: 'first_name', type: 'character varying', nullable: true },
      { name: 'last_name', type: 'character varying', nullable: true },
      { name: 'avatar_url', type: 'text', nullable: true },
      { name: 'timezone', type: 'character varying', nullable: true },
      { name: 'trading_experience', type: 'character varying', nullable: true },
      { name: 'subscription_tier', type: 'character varying', nullable: true },
      { name: 'is_active', type: 'boolean', nullable: false },
      { name: 'email_verified', type: 'boolean', nullable: false },
      { name: 'last_login', type: 'timestamp without time zone', nullable: true },
      { name: 'last_active', type: 'timestamp without time zone', nullable: true },
      { name: 'created_at', type: 'timestamp without time zone', nullable: false },
      { name: 'updated_at', type: 'timestamp without time zone', nullable: false },
      { name: 'deleted_at', type: 'timestamp without time zone', nullable: true }
    ];

    const actualColumns = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);

    let columnsValid = true;
    for (const expectedCol of expectedColumns) {
      const actualCol = actualColumns.rows.find(col => col.column_name === expectedCol.name);
      if (!actualCol) {
        console.log(`   ❌ Missing column: ${expectedCol.name}`);
        validationResults.errors.push(`Missing column: ${expectedCol.name}`);
        columnsValid = false;
      } else if (actualCol.data_type !== expectedCol.type) {
        console.log(`   ⚠️  Column ${expectedCol.name}: expected ${expectedCol.type}, got ${actualCol.data_type}`);
        validationResults.errors.push(`Column ${expectedCol.name}: type mismatch`);
        columnsValid = false;
      } else {
        const nullable = actualCol.is_nullable === 'YES';
        if (nullable !== expectedCol.nullable) {
          console.log(`   ⚠️  Column ${expectedCol.name}: nullable mismatch`);
          validationResults.errors.push(`Column ${expectedCol.name}: nullable mismatch`);
          columnsValid = false;
        } else {
          console.log(`   ✅ Column ${expectedCol.name}: ${actualCol.data_type}`);
        }
      }
    }
    validationResults.columnsValid = columnsValid;

    // 3. Validate constraints
    console.log('\n3. Validating constraints...');
    const constraints = await query(`
            SELECT constraint_name, constraint_type, column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'users'
            ORDER BY constraint_type, constraint_name
        `);

    const expectedConstraints = ['PRIMARY KEY', 'UNIQUE', 'CHECK'];
    let constraintsFound = {};
        
    constraints.rows.forEach(constraint => {
      constraintsFound[constraint.constraint_type] = (constraintsFound[constraint.constraint_type] || 0) + 1;
      console.log(`   ✅ ${constraint.constraint_type}: ${constraint.constraint_name} (${constraint.column_name})`);
    });

    // Check for required constraints
    if (constraintsFound['PRIMARY KEY'] >= 1 && 
            constraintsFound['UNIQUE'] >= 2 && 
            constraintsFound['CHECK'] >= 2) {
      validationResults.constraintsValid = true;
    } else {
      validationResults.errors.push('Missing required constraints');
    }

    // 4. Validate indexes
    console.log('\n4. Validating indexes...');
    const indexes = await query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'users'
            AND indexname NOT LIKE '%_pkey'
            ORDER BY indexname
        `);

    const expectedIndexCount = 8; // Based on schema
    if (indexes.rows.length >= expectedIndexCount) {
      console.log(`   ✅ Found ${indexes.rows.length} indexes (expected at least ${expectedIndexCount})`);
      indexes.rows.forEach(idx => {
        console.log(`   ✅ ${idx.indexname}`);
      });
      validationResults.indexesValid = true;
    } else {
      console.log(`   ❌ Found ${indexes.rows.length} indexes, expected at least ${expectedIndexCount}`);
      validationResults.errors.push('Insufficient indexes');
    }

    // 5. Validate triggers
    console.log('\n5. Validating triggers...');
    const triggers = await query(`
            SELECT trigger_name, event_manipulation, action_timing
            FROM information_schema.triggers 
            WHERE event_object_table = 'users'
        `);

    if (triggers.rows.length >= 1) {
      console.log(`   ✅ Found ${triggers.rows.length} trigger(s)`);
      triggers.rows.forEach(trigger => {
        console.log(`   ✅ ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
      });
      validationResults.triggersValid = true;
    } else {
      console.log('   ❌ No triggers found');
      validationResults.errors.push('Missing update trigger');
    }

    // 6. Test basic operations
    console.log('\n6. Testing basic operations...');
        
    // Test insert
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      username: `testuser_${Date.now()}`,
      password_hash: '$2b$10$test.hash.for.validation.purposes'
    };

    const insertResult = await query(`
            INSERT INTO users (email, username, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, email, created_at
        `, [testUser.email, testUser.username, testUser.password_hash]);

    if (insertResult.rows.length === 1) {
      console.log('   ✅ Insert operation successful');
      const userId = insertResult.rows[0].id;
            
      // Test update (should trigger updated_at)
      await query(`
                UPDATE users 
                SET first_name = 'Test' 
                WHERE id = $1
            `, [userId]);
            
      const updateCheck = await query(`
                SELECT updated_at > created_at as updated_correctly
                FROM users 
                WHERE id = $1
            `, [userId]);
            
      if (updateCheck.rows[0].updated_correctly) {
        console.log('   ✅ Update trigger working correctly');
      } else {
        console.log('   ❌ Update trigger not working');
        validationResults.errors.push('Update trigger malfunction');
      }
            
      // Cleanup test user
      await query('DELETE FROM users WHERE id = $1', [userId]);
      console.log('   ✅ Delete operation successful');
      console.log('   ✅ Test user cleaned up');
            
    } else {
      console.log('   ❌ Insert operation failed');
      validationResults.errors.push('Insert operation failed');
    }

  } catch (error) {
    console.error('   ❌ Validation error:', error.message);
    validationResults.errors.push(`Validation error: ${error.message}`);
  }

  return validationResults;
}

async function main() {
  console.log('Elite Trading Coach AI - Database Schema Validation');
  console.log('='.repeat(55));
    
  try {
    const results = await validateUsersTable();
        
    console.log('\n' + '='.repeat(55));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(55));
        
    console.log(`Table Exists:     ${results.tableExists ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Columns Valid:    ${results.columnsValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Constraints:      ${results.constraintsValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Indexes Valid:    ${results.indexesValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Triggers Valid:   ${results.triggersValid ? '✅ PASS' : '❌ FAIL'}`);
        
    const overallSuccess = results.tableExists && 
                              results.columnsValid && 
                              results.constraintsValid && 
                              results.indexesValid && 
                              results.triggersValid;
        
    console.log(`\nOverall Status:   ${overallSuccess ? '🎉 SUCCESS' : '💥 FAILED'}`);
        
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
        
    process.exit(overallSuccess ? 0 : 1);
        
  } catch (error) {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateUsersTable };