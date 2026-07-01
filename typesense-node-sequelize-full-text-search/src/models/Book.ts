import { Model, DataTypes, type Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface BookAttributes {
  id: number;
  title: string;
  authors: string[];
  publication_year: number;
  average_rating: number;
  image_url: string;
  ratings_count: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface BookCreationAttributes extends Optional<BookAttributes, 'id'> {}

export class Book extends Model<BookAttributes, BookCreationAttributes> implements BookAttributes {
  declare id: number;
  declare title: string;
  declare authors: string[];
  declare publication_year: number;
  declare average_rating: number;
  declare image_url: string;
  declare ratings_count: number;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date | null;
}

Book.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    authors: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    publication_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('average_rating');
        return value === null ? null : parseFloat(value as unknown as string);
      }
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ratings_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'books',
    timestamps: true,
    paranoid: true, // Enables soft deletes (deletedAt)
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);
