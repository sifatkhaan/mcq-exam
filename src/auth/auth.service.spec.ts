import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { RolesService } from '../roles/roles.service';
import { UserRoleService } from '../users/user-role.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OrganizationsService } from '../organizations/organizations.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: UserRoleService,
          useValue: {
            assignRole: jest.fn(),
          },
        },
        {
          provide: RolesService,
          useValue: {
            findByCode: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: OrganizationsService,
          useValue: {
            getUserOrganization: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
