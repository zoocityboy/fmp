/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export function extension(ctr: any ) {
    
    let originalFunction: Function;
    return function (target:any, propertyKey: string, descriptor: PropertyDescriptor) {
      originalFunction = descriptor.value;

      ctr.prototype[propertyKey] = function(...args:any[]){
        return originalFunction(this, ...args);
      }
    }
}


export class User {
  constructor(
    public name: string = 'joe',
    public lastname: string = 'doe'
  ){}
}

export class Extensions {
  @extension(User)
  static test(user: User){
    console.log(user.name , 'this works');
  }

  @extension(User)
  static gaveMoney(thisArg: User, amount: number, to: User){
    console.log(`${thisArg.name} gave ${to.name} $${amount}`);
  }
}
