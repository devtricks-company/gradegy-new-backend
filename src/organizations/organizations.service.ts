import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ExecuteQueryResult,
  MongooseQueryConfig,
  executeMongooseQuery,
} from '../common/utils/mongoose-query.util';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {
  Organization,
  OrganizationDocument,
  OrganizationType,
} from './schemas/organization.schema';

const ORGANIZATION_QUERY_CONFIG: MongooseQueryConfig<OrganizationDocument> = {
  searchableFields: ['title', 'short_title'],
  filterableFields: {
    title: { type: 'string', operators: ['eq', 'in'] },
    short_title: { type: 'string', operators: ['eq', 'in'] },
    organization_type: { type: 'string', operators: ['eq', 'in'] },
    lead_contact: { type: 'objectId', operators: ['eq', 'in'] },
    ufcs_member: { type: 'boolean', operators: ['eq'] },
    paid: { type: 'boolean', operators: ['eq'] },
    reward_system: { type: 'boolean', operators: ['eq'] },
    survey_system: { type: 'boolean', operators: ['eq'] },
    school_district: { type: 'objectId', operators: ['eq', 'in'] },
    university: { type: 'objectId', operators: ['eq', 'in'] },
    is_active: { type: 'boolean', operators: ['eq'] },
    createdAt: { type: 'date', operators: ['gte', 'lte'] },
    updatedAt: { type: 'date', operators: ['gte', 'lte'] },
  },
  allowedSortFields: [
    'title',
    'short_title',
    'organization_type',
    'lead_contact',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: { title: 1 },
  defaultLimit: 25,
  maxLimit: 100,
  lean: false,
  defaultPopulate:[{path:'school_district',select:'agancy_name state_name state_agancy_id'}]
};

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async create(
    createDto: CreateOrganizationDto,
  ): Promise<OrganizationDocument> {
    this.ensureAssociationRequirements({
      organizationType: createDto.organization_type,
      schoolDistrict: createDto.school_district,
      university: createDto.university,
    });

    const payload: Partial<Organization> = {
      title: createDto.title.trim(),
      short_title: this.normalizeNullableString(createDto.short_title),
      organization_type: createDto.organization_type,
      image: this.normalizeOptionalString(createDto.image),
      ufcs_member: createDto.ufcs_member ?? false,
      lead_contact: new Types.ObjectId(createDto.lead_contact),
      paid: createDto.paid ?? false,
      reward_system: createDto.reward_system ?? false,
      survey_system: createDto.survey_system ?? false,
      is_active: createDto.is_active ?? true,
    };

    if (createDto.organization_type === OrganizationType.Secondary) {
      payload.school_district = new Types.ObjectId(createDto.school_district);
      payload.university = undefined;
    } else if (createDto.organization_type === OrganizationType.PostSecondary) {
      payload.university = new Types.ObjectId(createDto.university);
      payload.school_district = undefined;
    } else {
      payload.school_district = undefined;
      payload.university = undefined;
    }

    if (!payload.image) {
      delete payload.image;
    }

    if (payload.short_title === undefined) {
      payload.short_title = null;
    }

    const organization = new this.organizationModel(payload);
    const savedOrganization = await organization.save();
    await savedOrganization.populate({
      path: 'school_district',
      select: 'agancy_name state_name state_agancy_id',
    });
    return savedOrganization;
  }

  async findAll(
    rawQuery: Record<string, unknown> = {},
  ): Promise<ExecuteQueryResult<OrganizationDocument>> {
    return executeMongooseQuery<OrganizationDocument>({
      model: this.organizationModel,
      rawQuery,
      config: ORGANIZATION_QUERY_CONFIG,
    });
  }

  async findOne(id: string): Promise<OrganizationDocument> {
    const organization = await this.organizationModel.findById(id).exec();

    if (!organization) {
      throw new NotFoundException(`Organization with id "${id}" not found.`);
    }

    return organization;
  }

  async update(
    id: string,
    updateDto: UpdateOrganizationDto,
  ): Promise<OrganizationDocument> {
    const organization = await this.organizationModel.findById(id).exec();

    if (!organization) {
      throw new NotFoundException(`Organization with id "${id}" not found.`);
    }

    const nextType =
      updateDto.organization_type ?? organization.organization_type;
    const nextSchoolDistrict =
      updateDto.school_district !== undefined
        ? updateDto.school_district
        : organization.school_district?.toString();
    const nextUniversity =
      updateDto.university !== undefined
        ? updateDto.university
        : organization.university?.toString();

    this.ensureAssociationRequirements({
      organizationType: nextType,
      schoolDistrict: nextSchoolDistrict,
      university: nextUniversity,
    });

    if (updateDto.title !== undefined) {
      organization.title = updateDto.title.trim();
    }

    if (updateDto.short_title !== undefined) {
      organization.short_title = this.normalizeNullableString(
        updateDto.short_title,
      );
    }

    if (updateDto.organization_type !== undefined) {
      organization.organization_type = updateDto.organization_type;
    }

    if (updateDto.image !== undefined) {
      const normalizedImage = this.normalizeOptionalString(updateDto.image);
      if (normalizedImage) {
        organization.image = normalizedImage;
      } else {
        organization.image = undefined;
      }
    }

    if (updateDto.ufcs_member !== undefined) {
      organization.ufcs_member = updateDto.ufcs_member;
    }

    if (updateDto.lead_contact !== undefined) {
      organization.lead_contact = new Types.ObjectId(updateDto.lead_contact);
    }

    if (updateDto.paid !== undefined) {
      organization.paid = updateDto.paid;
    }

    if (updateDto.reward_system !== undefined) {
      organization.reward_system = updateDto.reward_system;
    }

    if (updateDto.survey_system !== undefined) {
      organization.survey_system = updateDto.survey_system;
    }

    if (updateDto.is_active !== undefined) {
      organization.is_active = updateDto.is_active;
    }

    if (nextType === OrganizationType.Secondary) {
      if (updateDto.school_district !== undefined) {
        organization.school_district = new Types.ObjectId(
          updateDto.school_district,
        );
      }
      organization.university = undefined;
    } else if (nextType === OrganizationType.PostSecondary) {
      if (updateDto.university !== undefined) {
        organization.university = new Types.ObjectId(updateDto.university);
      }
      organization.school_district = undefined;
    } else {
      organization.school_district = undefined;
      organization.university = undefined;
    }

    return organization.save();
  }

  async remove(id: string): Promise<OrganizationDocument> {
    const organization = await this.organizationModel
      .findByIdAndDelete(id)
      .exec();

    if (!organization) {
      throw new NotFoundException(`Organization with id "${id}" not found.`);
    }

    return organization;
  }

  private ensureAssociationRequirements(args: {
    organizationType: OrganizationType;
    schoolDistrict?: string | Types.ObjectId | null;
    university?: string | Types.ObjectId | null;
  }): void {
    const { organizationType, schoolDistrict, university } = args;

    if (organizationType === OrganizationType.Secondary && !schoolDistrict) {
      throw new BadRequestException(
        'school_district is required when organization_type is secondary.',
      );
    }

    if (organizationType === OrganizationType.PostSecondary && !university) {
      throw new BadRequestException(
        'university is required when organization_type is post_secondary.',
      );
    }
  }

  private normalizeNullableString(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeOptionalString(value?: string | null): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
}


