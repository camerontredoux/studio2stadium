interface ApiDefinition {
  auth: {
    signup: {
      $url: {};
      $post: {
        request: {
          phone?: null | string;
        } & {
          email: string;
          password: string;
          confirmPassword: string;
          username: string;
          firstName: string;
          lastName: string;
          termsChecked: true;
        };
        response: {
          "201": {
            email: string;
            username: string;
            phone: null | string;
            id: string;
            display_email: string;
            first_name: string;
            last_name: string;
            image: null | string;
            created_at: string;
            updated_at: null | string;
          };
        } & {
          "422": {
            errors: Array<{
              message: string;
              rule: string;
              field: string;
            }>;
          };
        };
      };
    };
    login: {
      $url: {};
      $post: {
        request: {} & {
          email: string;
          password: string;
        };
        response: {
          "200": {
            id: string;
          };
        } & {
          "422": {
            errors: Array<{
              message: string;
              rule: string;
              field: string;
            }>;
          };
        };
      };
    };
    logout: {
      $url: {};
      $post: {
        request: unknown;
        response: {
          "200": {
            message: string;
          };
        };
      };
    };
    session: {
      $url: {};
      $get: {
        request: unknown;
        response: {
          "200": {
            email: string;
            username: string;
            phone: null | string;
            id: string;
            display_email: string;
            first_name: string;
            last_name: string;
            image: null | string;
            created_at: string;
            updated_at: null | string;
          };
        };
      };
      $head: {
        request: unknown;
        response: {
          "200": {
            email: string;
            username: string;
            phone: null | string;
            id: string;
            display_email: string;
            first_name: string;
            last_name: string;
            image: null | string;
            created_at: string;
            updated_at: null | string;
          };
        };
      };
    };
  };
}
