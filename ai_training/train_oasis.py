from unsloth import FastLanguageModel
import torch
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset

# 1. Configuration (The 4GB Survival Settings)
max_seq_length = 2048 
dtype = None 
load_in_4bit = True # CRITICAL: Shrinks the model by 75% so it fits in VRAM

print("Loading Model...")
# 2. Download the base AI Brain (Qwen 2.5 1.5B is incredibly smart and lightweight)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

print("Attaching LoRA Adapters...")
# 3. Add LoRA (Tells the GPU to only train 1% of the model instead of 100%)
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, 
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0, 
    bias = "none",
    use_gradient_checkpointing = "unsloth", # CRITICAL: Prevents Memory Crashes
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

print("Loading the Brain Food (Dataset)...")
# 4. Formatting the Dataset (Path A)
alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

EOS_TOKEN = tokenizer.eos_token
def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        text = alpaca_prompt.format(instruction, input, output) + EOS_TOKEN
        texts.append(text)
    return { "text" : texts, }

# We are using a clean, pre-built instruction dataset
dataset = load_dataset("yahma/alpaca-cleaned", split = "train")
dataset = dataset.map(formatting_prompts_func, batched = True)

print("Setting up Trainer Engine...")
# 5. The Training Engine
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False, 
    args = TrainingArguments(
        per_device_train_batch_size = 2, # Safe for 4GB GPU
        gradient_accumulation_steps = 4, 
        warmup_steps = 5,
        max_steps = 60, # QUICK TEST: Only running 60 steps so you can see it work quickly
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit", # CRITICAL: 8-bit optimizer saves more VRAM
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

print("Starting Training! Keep an eye on your GPU...")
# 6. Fire up the engines!
trainer_stats = trainer.train()

print("Training Complete! Saving the Oasis Node brain...")
# 7. Save the upgraded AI model to a local folder
model.save_pretrained("oasis_lora_model") 
tokenizer.save_pretrained("oasis_lora_model")
print("SUCCESS: Model saved to 'oasis_lora_model' folder!")