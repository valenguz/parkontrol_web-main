import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from './usuarios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { RolesService } from 'src/shared/services/roles/roles.service';
import { EmpresasService } from 'src/empresas/empresas.service';
import { UsuarioValidator } from './validators/usuario.validator';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RoleEnum } from 'src/shared/entities/rol.entity';
import { UsuarioResponseDto } from './entities/dto/usuario-response.dto';

describe('UsuariosService (UNIT - SIN CREAR)', () => {
  let service: UsuariosService;

  const mockUsuarioRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockRolesService = { findRoleByNombre: jest.fn() };
  const mockEmpresasService = { findEmpresaById: jest.fn() };
  const mockUsuarioValidator = {
    validarUsuarioUnico: jest.fn(),
    validarEsOperador: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: RolesService, useValue: mockRolesService },
        { provide: EmpresasService, useValue: mockEmpresasService },
        { provide: UsuarioValidator, useValue: mockUsuarioValidator },
        { provide: getRepositoryToken(Usuario), useValue: mockUsuarioRepository },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    jest.clearAllMocks();
  });

  it('C1: Debe retornar usuario por correo (Patrón AAA)', async () => {
    // Arrange
    const correoBusqueda = 'test@test.com';
    const usuarioMock = { id: 1, correo: correoBusqueda, empresa: { id: 1 } };
    mockUsuarioRepository.findOne.mockResolvedValue(usuarioMock);

    // Act
    const result = await service.findUsuarioByCorreo(correoBusqueda);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toEqual(usuarioMock);
    expect(mockUsuarioRepository.findOne).toHaveBeenCalled();
  });

  it('C2: Debe retornar null si no existe correo', async () => {
    mockUsuarioRepository.findOne.mockResolvedValue(null);

    const result = await service.findUsuarioByCorreo('no@test.com');

    expect(result).toBeNull();
  });

  it('C3: Debe retornar usuario por ID', async () => {
    const usuarioMock = { id: 1 };
    mockUsuarioRepository.findOne.mockResolvedValue(usuarioMock);

    const result = await service.findUsuarioById(1);

    expect(result).toEqual(usuarioMock);
    expect(mockUsuarioRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['empresa', 'rol']
    });
  });

  it('C4: Debe lanzar error si usuario no existe', async () => {
    mockUsuarioRepository.findOne.mockResolvedValue(null);

    const action = service.findUsuarioById(999);

    await expect(action).rejects.toThrow(NotFoundException);
  });

  it('C5: Debe listar usuarios por empresa', async () => {
    const usuariosMock = [
      { id: 1, nombre: 'U1', correo: 'u1@test.com', rol: {}, empresa: {} }
    ];
    mockUsuarioRepository.find.mockResolvedValue(usuariosMock);

    const result = await service.findByEmpresa(1);

    expect(result.length).toBe(1);
    expect(result[0]).toBeInstanceOf(UsuarioResponseDto);
    expect(mockUsuarioRepository.find).toHaveBeenCalledWith({
      where: { empresa: { id: 1 } },
      relations: ['empresa', 'rol']
    });
  });

  it('C6: Debe eliminar usuario operador', async () => {
    const usuarioMock = { id: 1, rol: { nombre: RoleEnum.OPERADOR } };

    jest.spyOn(service, 'findUsuarioById').mockResolvedValue(usuarioMock as any);
    mockUsuarioValidator.validarEsOperador.mockReturnValue(undefined);

    await service.eliminar(1);

    expect(mockUsuarioValidator.validarEsOperador).toHaveBeenCalledWith(usuarioMock);
    expect(mockUsuarioRepository.remove).toHaveBeenCalledWith(usuarioMock);
  });

  it('C7: Debe fallar si no es operador', async () => {
    const usuarioMock = { id: 1, rol: { nombre: RoleEnum.ADMIN } };

    jest.spyOn(service, 'findUsuarioById').mockResolvedValue(usuarioMock as any);
    mockUsuarioValidator.validarEsOperador.mockImplementation(() => {
      throw new ConflictException('Solo operadores');
    });

    const action = service.eliminar(1);

    await expect(action).rejects.toThrow(ConflictException);
    expect(mockUsuarioRepository.remove).not.toHaveBeenCalled();
  });

});