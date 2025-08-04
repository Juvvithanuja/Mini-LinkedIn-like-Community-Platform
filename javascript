import supabase from "@pipedream/supabase"
import bcrypt from "bcrypt"

export default defineComponent({
  name: "Register User",
  description: "Register a new user with email, password, name and optional bio. Validates email, hashes password, checks for duplicates, and stores in Supabase users table.",
  type: "action",
  props: {
    supabase,
    email: {
      type: "string",
      label: "Email",
      description: "User's email address"
    },
    password: {
      type: "string",
      label: "Password",
      description: "User's password (will be hashed before storage)",
      secret: true
    },
    name: {
      type: "string",
      label: "Name",
      description: "User's full name"
    },
    bio: {
      type: "string",
      label: "Bio",
      description: "Optional user biography",
      optional: true
    }
  },
  methods: {
    validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  },
  async run({ $ }) {
    // Validate email format
    if (!this.validateEmail(this.email)) {
      throw new Error("Invalid email format");
    }

    // Check if user already exists
    const existingUser = await this.supabase.selectRow({
      table: "users",
      column: "email",
      filter: "equalTo",
      value: this.email,
      max: 1
    });

    if (existingUser.data && existingUser.data.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(this.password, saltRounds);

    // Prepare user data
    const userData = {
      email: this.email,
      password_hash: passwordHash,
      name: this.name,
      created_at: new Date().toISOString()
    };

    if (this.bio) {
      userData.bio = this.bio;
    }

    // Insert new user
    const result = await this.supabase.insertRow("users", userData);

    // Return user data without password hash
    const newUser = result.data[0];
    const { password_hash, ...userWithoutPassword } = newUser;

    $.export("$summary", Successfully registered user: ${this.email});
    
    return userWithoutPassword;
  }
})
