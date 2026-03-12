# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]: Login to FarmWise
    - generic [ref=e7]: Enter your email below to login to your account.
  - generic [ref=e9]:
    - generic [ref=e10]:
      - text: Email
      - textbox "Email" [ref=e11]
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Password
        - link "Forgot your password?" [ref=e15] [cursor=pointer]:
          - /url: /forgot-password
      - textbox "Password" [ref=e16]
    - button "Login" [ref=e17]
  - generic [ref=e19]:
    - text: Don't have an account?
    - link "Sign up" [ref=e20] [cursor=pointer]:
      - /url: /register
```