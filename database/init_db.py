"""
Initialize and verify the Neon PostgreSQL Database for Yoruba AI.
Applies database/schema.sql, creates tables, and inserts initial records.
"""

import os
import sys

# Ensure UTF-8 printing on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.db import get_db_connection


def init_database():
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")

    print("=" * 70)
    print("INITIALIZING NEON POSTGRESQL DATABASE FOR YORUBA AI")
    print("=" * 70)

    # 1. Test Connection
    print("[1] Connecting to Neon Serverless PostgreSQL...")
    conn = get_db_connection()
    try:
        # Check PostgreSQL version
        version = conn.run("SELECT version();")[0][0]
        print(f"    [CONNECTED] {version[:65]}...\n")

        # 2. Execute Schema
        print(f"[2] Applying Database Schema ({schema_path})...")
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        conn.run(schema_sql)
        print("    [SUCCESS] All 6 tables and indexes created successfully!\n")

        # 3. Seed Initial Cultural Knowledge (Proverbs & Idioms)
        print("[3] Seeding Initial Cultural Knowledge...")
        sample_proverb = """
        INSERT INTO cultural_knowledge (category, yoruba_text, literal_translation, cultural_meaning, cultural_context)
        VALUES (
            'proverb',
            'Òwe lẹṣin ọ̀rọ̀, bí ọ̀rọ̀ bá sọnù, òwe la fi ń wá a.',
            'A proverb is the horse of speech; when speech is lost, a proverb is used to find it.',
            'Wisdom and proverbs are essential vehicles for recovering meaning and resolving misunderstandings.',
            'Used by elders when emphasizing the importance of deep wisdom and clarity in a debate.'
        )
        ON CONFLICT DO NOTHING;
        """
        conn.run(sample_proverb)

        sample_greeting = """
        INSERT INTO cultural_knowledge (category, yoruba_text, literal_translation, cultural_meaning, cultural_context)
        VALUES (
            'custom',
            'Ẹ kú àbọ̀ -> Káàbọ̀',
            'Welcome home / to this place.',
            'A warm traditional reception acknowledging the safe return of a traveler or visitor.',
            'Spoken naturally with vowel elision (Káàbọ̀) whenever receiving guests.'
        )
        ON CONFLICT DO NOTHING;
        """
        conn.run(sample_greeting)
        print("    [SUCCESS] Seed cultural records inserted!\n")

        # 4. Register Our First Trained Model Checkpoint
        print("[4] Registering First Model Checkpoint (yoruba_lm_0001)...")
        checkpoint_sql = """
        INSERT INTO model_checkpoints (version_code, model_type, total_parameters, final_loss, perplexity, notes)
        VALUES (
            'yoruba_lm_0001',
            'language',
            943744,
            0.0434,
            1.04,
            'First from-scratch sovereign Yoruba Transformer trained on CUDA Cloud GPU.'
        )
        ON CONFLICT (version_code) DO NOTHING;
        """
        conn.run(checkpoint_sql)
        print("    [SUCCESS] Model checkpoint yoruba_lm_0001 registered!\n")

        # 5. Verify Table Counts
        print("-" * 70)
        print("TABLE VERIFICATION:")
        tables = ["speakers", "recordings", "transcriptions", "reviews", "cultural_knowledge", "model_checkpoints"]
        for t in tables:
            count = conn.run(f"SELECT COUNT(*) FROM {t};")[0][0]
            print(f"  - Table '{t}': {count} records")

        print("=" * 70)
        print("NEON DATABASE FULLY INITIALIZED AND VERIFIED!")
        print("=" * 70)

    finally:
        conn.close()


if __name__ == "__main__":
    init_database()
