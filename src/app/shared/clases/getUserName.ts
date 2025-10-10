
  export class GetUserName {
     getUserName(): string | null {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
  }