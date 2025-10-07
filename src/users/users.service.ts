import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument, UserRole } from './schemas/user.schema';

export type OAuthProvider = 'google' | 'snapchat';

export interface OAuthUserInput {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

const ADMINISTRATIVE_ROLES: UserRole[] = [
  UserRole.Ultra,
  UserRole.Super,
  UserRole.Admin,
];

const ADMINISTRATIVE_USERS_QUERY_CONFIG: MongooseQueryConfig<UserDocument> = {
  searchableFields: ['firstName', 'lastName', 'email'],
  filterableFields: {
    firstName: { type: 'string', operators: ['eq', 'in'] },
    lastName: { type: 'string', operators: ['eq', 'in'] },
    email: {
      type: 'string',
      operators: ['eq', 'in'],
      allowCommaSeparatedArrays: true,
    },
    role: { type: 'string', operators: ['eq', 'in'] },
    isActive: { type: 'boolean', operators: ['eq'] },
    lastLoginAt: { type: 'date', operators: ['gte', 'lte'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: [
    'firstName',
    'lastName',
    'email',
    'role',
    'lastLoginAt',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: { createdAt: -1 },
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
  baseFilter: { role: { $in: ADMINISTRATIVE_ROLES } },
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const payload = {
      ...createUserDto,
      email: createUserDto.email?.toLowerCase(),
    };

    const createdUser = new this.userModel(payload);
    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findAllAdministrative(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<UserDocument>> {
    return executeMongooseQuery<UserDocument>({
      model: this.userModel,
      rawQuery,
      config: ADMINISTRATIVE_USERS_QUERY_CONFIG,
    });
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found.`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByProvider(
    provider: OAuthProvider,
    providerId: string,
  ): Promise<UserDocument | null> {
    const query: FilterQuery<UserDocument> =
      provider === 'google'
        ? { googleId: providerId }
        : { snapchatId: providerId };
    return this.userModel.findOne(query).exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const updatePayload = {
      ...updateUserDto,
      email: updateUserDto.email?.toLowerCase(),
    };

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with id "${id}" not found.`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<UserDocument> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

    if (!deletedUser) {
      throw new NotFoundException(`User with id "${id}" not found.`);
    }

    return deletedUser;
  }

  async upsertOAuthUser(input: OAuthUserInput): Promise<UserDocument> {
    const providerField: 'googleId' | 'snapchatId' =
      input.provider === 'google' ? 'googleId' : 'snapchatId';
    const existingByProvider = await this.findByProvider(
      input.provider,
      input.providerId,
    );

    if (existingByProvider) {
      if (input.email && !existingByProvider.email) {
        existingByProvider.email = input.email.toLowerCase();
      }
      if (input.firstName && !existingByProvider.firstName) {
        existingByProvider.firstName = input.firstName;
      }
      if (input.lastName && !existingByProvider.lastName) {
        existingByProvider.lastName = input.lastName;
      }
      if (input.avatarUrl && !existingByProvider.avatarUrl) {
        existingByProvider.avatarUrl = input.avatarUrl;
      }

      existingByProvider.lastLoginAt = new Date();
      return existingByProvider.save();
    }

    let user = input.email ? await this.findByEmail(input.email) : null;

    if (!user) {
      user = new this.userModel({
        email: input.email?.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        avatarUrl: input.avatarUrl,
        isActive: true,
      });
    }

    user[providerField] = input.providerId;
    user.lastLoginAt = new Date();

    return user.save();
  }

  async recordLogin(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: false })
      .exec();
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        refreshTokenHash,
        refreshTokenExpiresAt: expiresAt,
      })
      .exec();
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $unset: { refreshTokenHash: '', refreshTokenExpiresAt: '' },
      })
      .exec();
  }
}
